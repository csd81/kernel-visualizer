import { describe, expect, test } from "bun:test";
import { createInitialState, tick as simTick } from "@/lib/sim";
import { fork, kill, createProcess, scheduleFcfs, renice } from "@/lib/scheduler";

describe("createProcess", () => {
  test("creates a process with correct defaults", () => {
    const proc = createProcess(42, 10, 5, 0);
    expect(proc.pid).toBe(42);
    expect(proc.totalTicks).toBe(10);
    expect(proc.remainingTicks).toBe(10);
    expect(proc.priority).toBe(5);
    expect(proc.state).toBe("READY");
    expect(proc.readyTick).toBe(0);
    expect(proc.holds).toEqual([]);
    expect(proc.waitsFor).toBe(-1);
    expect(proc.pageTable).toEqual([]);
  });

  test("clamps priority to 0–9", () => {
    expect(createProcess(1, 10, 15, 0).priority).toBe(9);
    expect(createProcess(2, 10, -5, 0).priority).toBe(0);
  });

  test("assigns deterministic color", () => {
    const p1 = createProcess(1, 10, 0, 0);
    const p2 = createProcess(1, 10, 0, 0);
    expect(p1.color).toBe(p2.color);
  });
});

describe("fork", () => {
  test("creates a new process in the state with nextPid", () => {
    const state = createInitialState();
    expect(state.nextPid).toBe(4);
    const { state: next, message } = fork(state, 15, 3);
    expect(next.processes).toHaveLength(state.processes.length + 1);
    expect(message).toContain("Created PID 4");
    expect(next.nextPid).toBe(5);
    expect(next.processes.find(p => p.pid === 4)?.totalTicks).toBe(15);
    expect(next.processes.find(p => p.pid === 4)?.priority).toBe(3);
  });

  test("uses defaults when args are NaN", () => {
    const state = createInitialState();
    const { state: next, message } = fork(state, NaN, NaN);
    expect(message).toContain("Created PID");
    // isNaN(NaN) → true → default ticks=10 → clamped to max(1,100,10)=10
    expect(next.processes.find(p => p.pid === 4)?.totalTicks).toBe(10);
    expect(next.processes.find(p => p.pid === 4)?.priority).toBe(0);
  });

  test("returns error at max processes", () => {
    let state = createInitialState();
    state = { ...state, nextPid: 1 }; // reset counter
    // Fill up processes via fork
    let lastMsg = "";
    for (let i = 0; i < 1030; i++) {
      const result = fork(state, 1, 0);
      if (result.message.startsWith("Error")) {
        lastMsg = result.message;
        break;
      }
      state = result.state;
    }
    expect(lastMsg).toBe("Error: maximum processes reached");
  });
});

describe("kill", () => {
  test("terminates a process", () => {
    const state = createInitialState();
    const pid = state.processes[0].pid;
    const { state: next, message } = kill(state, pid);
    expect(message).toContain("terminated");
    expect(next.processes.find(p => p.pid === pid)?.state).toBe("TERMINATED");
  });

  test("returns error for unknown PID", () => {
    const state = createInitialState();
    const { message } = kill(state, 9999);
    expect(message).toBe("Error: unknown PID 9999");
  });

  test("returns error for already terminated", () => {
    const state = createInitialState();
    const pid = state.processes[0].pid;
    const { state: afterFirst } = kill(state, pid);
    const { message } = kill(afterFirst, pid);
    expect(message).toContain("already terminated");
  });
});

describe("renice", () => {
  test("changes process priority", () => {
    const state = createInitialState();
    const { state: next, message } = renice(state, 1, 9);
    expect(next.processes.find(p => p.pid === 1)?.priority).toBe(9);
    expect(message).toContain("set to 9");
  });

  test("clamps priority to 0–9", () => {
    const state = createInitialState();
    const { state: next } = renice(state, 1, 99);
    expect(next.processes.find(p => p.pid === 1)?.priority).toBe(9);
  });

  test("returns error for unknown PID", () => {
    const state = createInitialState();
    const { message } = renice(state, 999, 5);
    expect(message).toContain("unknown PID");
  });

  test("returns error for terminated process", () => {
    let state = createInitialState();
    state = kill(state, 1).state;
    const { message } = renice(state, 1, 5);
    expect(message).toContain("terminated");
  });
});

describe("scheduleFcfs", () => {
  test("duration is set on history entries when process terminates", () => {
    // Replicate the real app flow: tick() increments state.tick, then scheduler runs
    let state = createInitialState();
    for (let i = 0; i < 12; i++) {
      state = simTick(state);      // increments state.tick
      state = scheduleFcfs(state); // uses state.tick for history
    }

    const terminated = state.history.find(h => h.event === "terminated" && h.pid === 1);
    expect(terminated).toBeDefined();

    // PID 1's "scheduled" entry should have its duration patched
    const scheduled = state.history.find(h => h.event === "scheduled" && h.pid === 1);
    expect(scheduled).toBeDefined();
    expect(scheduled!.duration).toBeGreaterThan(0);
    // PID 1 ran for 10 ticks before terminating
    expect(scheduled!.duration).toBe(10);
  });
  test("picks first READY process when none running", () => {
    const state = createInitialState();
    const next = scheduleFcfs(state);
    const running = next.processes.find(p => p.state === "RUNNING");
    expect(running).toBeDefined();
    expect(running?.pid).toBe(1);
    expect(next.stats.contextSwitches).toBe(1);
  });

  test("decrements remaining ticks for running process", () => {
    const state = createInitialState();
    const tick1 = scheduleFcfs(state);
    const running = tick1.processes.find(p => p.state === "RUNNING")!;
    const before = running.remainingTicks;
    const tick2 = scheduleFcfs(tick1);
    const after = tick2.processes.find(p => p.state === "RUNNING")!;
    expect(after.remainingTicks).toBe(before - 1);
  });

  test("terminates process when remainingTicks hits 0", () => {
    let state = createInitialState();
    // Kill PID 2 and PID 3 so only PID 1 is queued
    state = kill(state, 2).state;
    state = kill(state, 3).state;
    // Fork a 1-tick process (PID 4)
    const { state: withFork } = fork(state, 1, 0);
    // PID 1 runs first (FCFS). Call 11 terminates PID 1 and picks PID 4.
    let s = withFork;
    for (let i = 0; i < 11; i++) s = scheduleFcfs(s);
    // PID 4 should now be RUNNING (1 tick)
    expect(s.processes.find(p => p.pid === 4)?.state).toBe("RUNNING");
    // Next tick — should finish
    s = scheduleFcfs(s);
    expect(s.processes.find(p => p.pid === 4)?.state).toBe("TERMINATED");
  });

  test("picks next READY when current terminates", () => {
    let state = createInitialState();
    // PID 1 (10 ticks) runs. 12 calls: 1 set + 10 drain + 1 to pick PID 2.
    for (let i = 0; i < 12; i++) state = scheduleFcfs(state);
    expect(state.processes.find(p => p.pid === 1)?.state).toBe("TERMINATED");
    const running = state.processes.find(p => p.state === "RUNNING");
    expect(running?.pid).toBe(2);
  });
});
