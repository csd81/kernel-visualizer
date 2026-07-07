import { describe, expect, test } from "bun:test";
import { createInitialState } from "@/lib/sim";
import { fork, kill } from "@/lib/scheduler";
import { allocateFrames, TOTAL_FRAMES } from "@/lib/memory";
import { createFile, deleteFile, diskFragPct } from "@/lib/filesystem";
import { processShellCommand } from "@/lib/terminal";

describe("Resource exhaustion", () => {
  test("fork rejects after reaching max processes", () => {
    let state = createInitialState();
    let lastMessage = "";

    for (let i = 0; i < 1030; i++) {
      const result = fork(state, 1, 0);
      if (result.message.startsWith("Error")) {
        lastMessage = result.message;
        break;
      }
      state = result.state;
    }

    expect(lastMessage).toContain("maximum processes reached");
    expect(state.processes.length).toBeLessThanOrEqual(1024);
  });

  test("allocating all memory fills every frame", () => {
    const state = createInitialState();
    const { memory, message } = allocateFrames(state.memory, 999, TOTAL_FRAMES);
    expect(message).toBeNull();
    expect(memory.frames.filter(f => f.pid === null)).toHaveLength(0);
  });

  test("cannot alloc beyond total memory", () => {
    const state = createInitialState();
    const { message } = allocateFrames(state.memory, 1, TOTAL_FRAMES + 1);
    expect(message).toContain("insufficient");
  });

  test("full memory rejects further allocs", () => {
    const state = createInitialState();
    const { memory: full } = allocateFrames(state.memory, 1, TOTAL_FRAMES);
    const { message } = allocateFrames(full, 2, 1);
    expect(message).toContain("insufficient");
  });

  test("filling all inodes then rejects new files", () => {
    let disk = createInitialState().disk;
    disk = createFile(disk, "a.txt", 1).disk;
    disk = createFile(disk, "b.txt", 1).disk;
    disk = createFile(disk, "c.txt", 1).disk;
    disk = createFile(disk, "d.txt", 1).disk;
    const { message } = createFile(disk, "e.txt", 1);
    expect(message).toContain("no free inodes");
  });
});

describe("Edge cases and invalid inputs", () => {
  test("kill non-existent PID", () => {
    const state = createInitialState();
    const { message } = kill(state, 99999);
    expect(message).toBe("Error: unknown PID 99999");
  });

  test("kill already-terminated PID", () => {
    let state = createInitialState();
    const pid = state.processes[0].pid;
    state = kill(state, pid).state;
    const { message } = kill(state, pid);
    expect(message).toContain("already terminated");
  });

  test("delete non-existent file", () => {
    const disk = createInitialState().disk;
    const { message } = deleteFile(disk, "ghost.txt");
    expect(message).toContain("not found");
  });

  test("fork with extreme values clamps correctly", () => {
    const state = createInitialState();
    const { state: next, message } = fork(state, 1e6, 1e6);
    expect(message).toContain("Created");
    const proc = next.processes[state.processes.length];
    expect(proc?.totalTicks).toBeLessThanOrEqual(100);
    expect(proc?.priority).toBeLessThanOrEqual(9);
  });

  test("shell handles empty command gracefully", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "");
    // Adds input line + unknown command error = 2 new lines
    const newLines = next.terminal.output.length - state.terminal.output.length;
    expect(newLines).toBe(2);
  });

  test("shell handles whitespace-only command", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "   ");
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.type).toBe("error");
  });

  test("shell handles extremely long input without crashing", () => {
    const state = createInitialState();
    const longInput = "create " + "x".repeat(500) + " 5";
    const next = processShellCommand(state, longInput);
    expect(next).toBeDefined();
  });
});

describe("State consistency", () => {
  test("all processes have unique PIDs", () => {
    const state = createInitialState();
    const pids = state.processes.map(p => p.pid);
    expect(new Set(pids).size).toBe(pids.length);
  });

  test("fork produces unique PIDs sequentially", () => {
    let state = createInitialState();
    for (let i = 0; i < 50; i++) {
      const result = fork(state, 5, 1);
      state = result.state;
    }
    const pids = state.processes.map(p => p.pid);
    expect(new Set(pids).size).toBe(pids.length);
  });

  test("immutability: original state unchanged after fork", () => {
    const state = createInitialState();
    const origLength = state.processes.length;
    fork(state, 10, 2);
    expect(state.processes.length).toBe(origLength);
  });

  test("immutability: original state unchanged after alloc", () => {
    const state = createInitialState();
    const freeBefore = state.memory.frames.filter(f => f.pid === null).length;
    allocateFrames(state.memory, 1, 10);
    const freeAfter = state.memory.frames.filter(f => f.pid === null).length;
    expect(freeAfter).toBe(freeBefore);
  });
});

describe("Fragmentation boundary", () => {
  test("diskFragPct handles empty data blocks", () => {
    const state = createInitialState();
    expect(diskFragPct(state.disk.blocks)).toBe(0);
  });
});
