import { describe, expect, test } from "bun:test";
import { createInitialState } from "@/lib/sim";
import { fork, kill, scheduleFcfs } from "@/lib/scheduler";
import { allocateFrames, freeProcessFrames } from "@/lib/memory";
import { createFile, deleteFile, ls, df } from "@/lib/filesystem";

describe("Fork → Schedule → Terminate lifecycle", () => {
  test("process flows through READY→RUNNING→TERMINATED", () => {
    let state = createInitialState();
    // Fork a 3-tick process (PID 4)
    state = kill(state, 2).state;
    state = kill(state, 3).state;
    const { state: withProc } = fork(state, 3, 0);
    // Run 12 calls: 1 to set RUNNING + 10 to drain + 1 to pick PID 4
    let s = withProc;
    for (let i = 0; i < 12; i++) s = scheduleFcfs(s);
    // PID 4 should now be RUNNING (3 ticks)
    expect(s.processes.find(p => p.pid === 4)?.state).toBe("RUNNING");
    // Consume 3 ticks
    s = scheduleFcfs(s);
    s = scheduleFcfs(s);
    s = scheduleFcfs(s);
    expect(s.processes.find(p => p.pid === 4)?.state).toBe("TERMINATED");
  });

  test("context switches increment correctly", () => {
    let state = createInitialState();
    // First schedule — PID 1 starts
    let s = scheduleFcfs(state);
    expect(s.stats.contextSwitches).toBe(1);

    // Run until PID 1 finishes and PID 2 starts
    for (let i = 0; i < 11; i++) s = scheduleFcfs(s);
    // PID 2 starts — another context switch
    expect(s.stats.contextSwitches).toBe(2);
  });
});

describe("Memory allocation and deallocation", () => {
  test("alloc frames → free → frames return to null", () => {
    const state = createInitialState();
    const { memory: afterAlloc } = allocateFrames(state.memory, 7, 16);
    const ownedAfterAlloc = afterAlloc.frames.filter(f => f.pid === 7);
    expect(ownedAfterAlloc).toHaveLength(16);

    const afterFree = freeProcessFrames(afterAlloc, 7);
    const ownedAfterFree = afterFree.frames.filter(f => f.pid === 7);
    expect(ownedAfterFree).toHaveLength(0);
  });

  test("free does not affect other processes", () => {
    const state = createInitialState();
    const { memory: a1 } = allocateFrames(state.memory, 7, 8);
    const { memory: a2 } = allocateFrames(a1, 9, 4);
    const afterFree = freeProcessFrames(a2, 7);

    expect(afterFree.frames.filter(f => f.pid === 7)).toHaveLength(0);
    expect(afterFree.frames.filter(f => f.pid === 9)).toHaveLength(4);
  });

  test("allocation is immutable — original memory unchanged", () => {
    const state = createInitialState();
    const freeBefore = state.memory.frames.filter(f => f.pid === null).length;
    allocateFrames(state.memory, 1, 10);
    const freeAfter = state.memory.frames.filter(f => f.pid === null).length;
    expect(freeAfter).toBe(freeBefore);
  });
});

describe("File lifecycle", () => {
  test("create → ls → delete → ls", () => {
    let disk = createInitialState().disk;
    disk = createFile(disk, "test.txt", 3).disk;
    expect(ls(disk)).toContain("test.txt");

    disk = deleteFile(disk, "test.txt").disk;
    expect(ls(disk)).toBe("No files.");
  });

  test("multiple files show correct df stats", () => {
    let disk = createInitialState().disk;
    disk = createFile(disk, "a.txt", 5).disk;
    disk = createFile(disk, "b.txt", 7).disk;

    const usage = df(disk);
    expect(usage).toContain("12/122");
    expect(usage).toContain("Inodes: 2/4");
  });
});

describe("Cross-subsystem: kill with memory (Phase 12+)", () => {
  test("kill marks process as TERMINATED — memory cleanup via freeMem", () => {
    let state = createInitialState();
    const pid = 1;
    // Allocate frames to PID 1
    const { memory } = allocateFrames(state.memory, pid, 16);
    state = { ...state, memory };

    // Kill PID 1 — marks TERMINATED (memory cleanup is a separate call)
    const result = kill(state, pid);
    expect(result.state.processes.find(p => p.pid === pid)?.state).toBe("TERMINATED");

    // Free memory manually
    const freeMem = freeProcessFrames(result.state.memory, pid);
    expect(freeMem.frames.filter(f => f.pid === pid)).toHaveLength(0);
  });
});
