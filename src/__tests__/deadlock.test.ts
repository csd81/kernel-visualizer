import { describe, expect, test } from "bun:test";
import { detectDeadlock } from "@/lib/deadlock";
import type { Process } from "@/types/process";

function makeProc(pid: number, waitsFor: number): Process {
  return {
    pid, state: "READY",
    totalTicks: 10, remainingTicks: 10, priority: 5,
    arrivalTick: 0, totalRunTicks: 0,
    currentQuantumTicks: 0, ticksSinceRun: 0, blockedTick: 0, mlfqLevel: 0,
    color: "#fff", pageTable: [], holds: [], waitsFor,
  };
}

describe("detectDeadlock", () => {
  test("returns empty for no processes", () => {
    expect(detectDeadlock([])).toEqual([]);
  });

  test("returns empty for processes that aren't waiting", () => {
    const procs = [makeProc(1, -1), makeProc(2, -1)];
    expect(detectDeadlock(procs)).toEqual([]);
  });

  test("detects 2-process cycle", () => {
    const procs = [makeProc(1, 2), makeProc(2, 1)];
    const result = detectDeadlock(procs);
    expect(result.sort()).toEqual([1, 2]);
  });

  test("detects 3-process cycle", () => {
    const procs = [makeProc(1, 2), makeProc(2, 3), makeProc(3, 1)];
    const result = detectDeadlock(procs).sort();
    expect(result).toEqual([1, 2, 3]);
  });

  test("does not flag non-cycle wait chain", () => {
    const procs = [makeProc(1, 2), makeProc(2, 3), makeProc(3, -1)];
    expect(detectDeadlock(procs)).toEqual([]);
  });

  test("only includes processes in the cycle", () => {
    const procs = [
      makeProc(1, 2),
      makeProc(2, 1),
      makeProc(3, -1),
      makeProc(4, -1),
    ];
    const result = detectDeadlock(procs).sort();
    expect(result).toEqual([1, 2]);
    expect(result).not.toContain(3);
    expect(result).not.toContain(4);
  });

  test("handles self-wait (trivial cycle)", () => {
    const procs = [makeProc(1, 1)];
    const result = detectDeadlock(procs);
    expect(result).toContain(1);
  });

  test("handles complex graph with one deadlock island", () => {
    const procs = [
      makeProc(1, 2),
      makeProc(2, 3),
      makeProc(3, 1), // 1→2→3→1 deadlocked
      makeProc(4, 5),
      makeProc(5, -1), // 4→5→(none) not deadlocked
    ];
    const result = detectDeadlock(procs).sort();
    expect(result).toEqual([1, 2, 3]);
  });
});
