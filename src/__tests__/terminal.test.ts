import { describe, expect, test } from "bun:test";
import { createInitialState } from "@/lib/sim";
import { processShellCommand } from "@/lib/terminal";

describe("processShellCommand", () => {
  test("handles help command", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "help");
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.text).toContain("Available commands");
    expect(lastOutput.type).toBe("info");
  });

  test("handles unknown command", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "foobar");
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.text).toContain("Unknown command");
    expect(lastOutput.type).toBe("error");
  });

  test("handles fork command", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "fork 15 3");
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.text).toContain("Created PID");
    expect(lastOutput.type).toBe("success");
    expect(next.processes).toHaveLength(state.processes.length + 1);
  });

  test("handles fork with missing args", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "fork");
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.type).toBe("error");
  });

  test("handles kill command", () => {
    const state = createInitialState();
    const pid = state.processes[0].pid;
    const next = processShellCommand(state, `kill ${pid}`);
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.text).toContain("terminated");
    expect(lastOutput.type).toBe("success");
  });

  test("handles kill with unknown PID", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "kill 9999");
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.text).toBe("Error: unknown PID 9999");
    expect(lastOutput.type).toBe("error");
  });

  test("handles ps command", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "ps");
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.text).toContain("PID");
    expect(lastOutput.text).toContain("READY");
  });

  test("handles alloc command", () => {
    const state = createInitialState();
    const pid = state.processes[0].pid;
    const next = processShellCommand(state, `alloc ${pid} 8`);
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.text).toContain("Allocated 8 KB");
    expect(lastOutput.type).toBe("success");
  });

  test("handles alloc with insufficient memory", () => {
    const state = createInitialState();
    const pid = state.processes[0].pid;
    const next = processShellCommand(state, `alloc ${pid} 500`);
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.text).toContain("Error");
    expect(lastOutput.type).toBe("error");
  });

  test("handles free command", () => {
    const state = createInitialState();
    const pid = state.processes[0].pid;
    let s = processShellCommand(state, `alloc ${pid} 8`);
    s = processShellCommand(s, `free ${pid}`);
    const lastOutput = s.terminal.output[s.terminal.output.length - 1];
    expect(lastOutput.text).toContain("Freed");
    expect(lastOutput.type).toBe("success");
  });

  test("handles create command", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "create test.txt 5");
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.text).toContain("Created");
    expect(lastOutput.type).toBe("success");
  });

  test("handles create with missing args", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "create");
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.type).toBe("error");
  });

  test("handles rm command", () => {
    let state = createInitialState();
    state = processShellCommand(state, "create test.txt 5");
    const next = processShellCommand(state, "rm test.txt");
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.text).toContain("Deleted");
    expect(lastOutput.type).toBe("success");
  });

  test("handles rm with non-existent file", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "rm nonexistent.txt");
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.text).toContain("not found");
  });

  test("handles ls command", () => {
    let state = createInitialState();
    state = processShellCommand(state, "create test.txt 3");
    const next = processShellCommand(state, "ls");
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.text).toContain("test.txt");
  });

  test("handles df command", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "df");
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.text).toContain("Disk");
  });

  test("handles speed command", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "speed 200");
    expect(next.speed).toBe(200);
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.text).toContain("200ms");
  });

  test("handles speed with out-of-range value", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "speed 5000");
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.type).toBe("error");
  });

  test("handles pause command", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "pause");
    expect(next.running).toBe(false);
  });

  test("handles resume command", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "resume");
    expect(next.running).toBe(true);
  });

  test("handles pfault command", () => {
    const state = createInitialState();
    const pid = state.processes[0].pid;
    const next = processShellCommand(state, `pfault ${pid} 0`);
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.text).toContain("PAGE FAULT");
    expect(lastOutput.type).toBe("warning");
    expect(next.processes.find(p => p.pid === pid)?.state).toBe("BLOCKED");
  });

  test("handles pfault with missing args", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "pfault");
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.type).toBe("error");
  });

  test("handles renice command", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "renice 1 9");
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.text).toContain("set to 9");
    expect(lastOutput.type).toBe("success");
    expect(next.processes.find(p => p.pid === 1)?.priority).toBe(9);
  });

  test("handles renice with missing args", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "renice");
    const lastOutput = next.terminal.output[next.terminal.output.length - 1];
    expect(lastOutput.type).toBe("error");
  });

  test("alloc populates pageTable on process", () => {
    const state = createInitialState();
    const pid = state.processes[0].pid;
    const next = processShellCommand(state, `alloc ${pid} 4`);
    const proc = next.processes.find(p => p.pid === pid);
    expect(proc?.pageTable.length).toBeGreaterThanOrEqual(4);
    expect(proc?.holds.length).toBeGreaterThanOrEqual(4);
  });

  test("free clears pageTable and holds", () => {
    const state = createInitialState();
    const pid = state.processes[0].pid;
    let s = processShellCommand(state, `alloc ${pid} 4`);
    s = processShellCommand(s, `free ${pid}`);
    const proc = s.processes.find(p => p.pid === pid);
    expect(proc?.pageTable).toEqual([]);
    expect(proc?.holds).toEqual([]);
  });

  test("handles clear command", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "clear");
    expect(next.terminal.output).toEqual([]);
  });

  test("echoes input as a line", () => {
    const state = createInitialState();
    const next = processShellCommand(state, "help");
    const inputLine = next.terminal.output.find(l => l.type === "input");
    expect(inputLine).toBeDefined();
    expect(inputLine?.text).toBe("help");
  });
});
