import { describe, expect, test } from "bun:test";
import { createInitialMemoryState, createInitialState } from "@/lib/sim";
import { firstFit, bestFit, allocateFrames, freeProcessFrames, largestFreeBlock, memoryStats, TOTAL_FRAMES, buildPageTable, simulatePageFault, resolvePageFault } from "@/lib/memory";

describe("firstFit", () => {
  test("finds first contiguous block starting at 0", () => {
    const mem = createInitialMemoryState();
    const start = firstFit(mem.frames, 8);
    expect(start).toBe(0);
  });

  test("skips allocated frames", () => {
    const mem = createInitialMemoryState();
    mem.frames[0].pid = 1;
    mem.frames[1].pid = 1;
    const start = firstFit(mem.frames, 5);
    expect(start).toBe(2);
  });

  test("returns -1 when insufficient contiguous space", () => {
    const mem = createInitialMemoryState();
    for (let i = 0; i < 256; i++) mem.frames[i].pid = 1;
    const start = firstFit(mem.frames, 1);
    expect(start).toBe(-1);
  });
});

describe("bestFit", () => {
  test("finds smallest sufficient block", () => {
    const mem = createInitialMemoryState();
    // Allocate frames to create gaps: 0-4 free (5), 5-9 alloc, 10-14 free (5), 15-29 alloc, 30-255 free (226)
    for (let i = 5; i < 10; i++) mem.frames[i].pid = 1;
    for (let i = 15; i < 30; i++) mem.frames[i].pid = 1;
    const start = bestFit(mem.frames, 3);
    // Should pick either 0-4 or 10-14 (both have 5 free — smallest that fits 3)
    expect(start === 0 || start === 10).toBe(true);
  });

  test("returns -1 when no block fits", () => {
    const mem = createInitialMemoryState();
    for (let i = 0; i < 200; i++) mem.frames[i].pid = 1;
    // Free: 200-255 (56 frames)
    const start = bestFit(mem.frames, 100);
    expect(start).toBe(-1);
  });
});

describe("allocateFrames", () => {
  test("allocates contiguous frames to pid", () => {
    const mem = createInitialMemoryState();
    const { memory, allocated, message } = allocateFrames(mem, 5, 8);
    expect(message).toBeNull();
    expect(allocated).toHaveLength(8);
    expect(allocated[0]).toBe(0);
    expect(allocated[7]).toBe(7);
    for (const idx of allocated) {
      expect(memory.frames[idx].pid).toBe(5);
    }
  });

  test("returns error when insufficient memory", () => {
    const mem = createInitialMemoryState();
    const { message } = allocateFrames(mem, 1, 300);
    expect(message).toContain("insufficient contiguous memory");
  });

  test("allocations are immutable — use returned memory for chaining", () => {
    const mem = createInitialMemoryState();
    const { memory: afterFirst } = allocateFrames(mem, 1, 10);
    // Second alloc uses the result of the first
    const { allocated } = allocateFrames(afterFirst, 2, 5);
    expect(allocated[0]).toBe(10);
    expect(allocated).toHaveLength(5);
  });
});

describe("freeProcessFrames", () => {
  test("frees all frames for a pid", () => {
    const mem = createInitialMemoryState();
    const { memory: withAlloc } = allocateFrames(mem, 5, 4);
    const freed = freeProcessFrames(withAlloc, 5);
    expect(freed.frames.filter(f => f.pid === 5)).toHaveLength(0);
  });

  test("does not affect other PIDs", () => {
    const mem = createInitialMemoryState();
    const { memory: after1 } = allocateFrames(mem, 5, 4);
    const { memory: after2 } = allocateFrames(after1, 7, 4);
    const freed = freeProcessFrames(after2, 5);
    expect(freed.frames.filter(f => f.pid === 7)).toHaveLength(4);
  });
});

describe("largestFreeBlock", () => {
  test("returns 256 when all free", () => {
    const mem = createInitialMemoryState();
    expect(largestFreeBlock(mem.frames)).toBe(256);
  });

  test("returns correct size in fragmented scenario", () => {
    const mem = createInitialMemoryState();
    for (let i = 0; i < 10; i++) mem.frames[i].pid = 1;
    for (let i = 20; i < 25; i++) mem.frames[i].pid = 1;
    // Free gaps: 10-19 (10), 25-255 (231). Largest = 231
    expect(largestFreeBlock(mem.frames)).toBe(231);
  });
});

describe("buildPageTable", () => {
  test("creates page table entries from allocated frame list", () => {
    const pte = buildPageTable([10, 11, 12]);
    expect(pte).toHaveLength(3);
    expect(pte[0]).toEqual({ logicalPage: 0, frameNum: 10, present: true });
    expect(pte[1]).toEqual({ logicalPage: 1, frameNum: 11, present: true });
    expect(pte[2]).toEqual({ logicalPage: 2, frameNum: 12, present: true });
  });
});

describe("simulatePageFault", () => {
  test("blocks the process and increments counter", () => {
    const state = createInitialState();
    const pid = state.processes[0].pid;
    const { state: next, message } = simulatePageFault(state, pid, 0);
    expect(next.processes.find(p => p.pid === pid)?.state).toBe("BLOCKED");
    expect(next.processes.find(p => p.pid === pid)?.blockedTick).toBe(0);
    expect(next.stats.pageFaults).toBe(1);
    expect(next.memory.faultFlash).toBe(true);
    expect(message).toContain("PAGE FAULT");
  });

  test("sets blockedTick to current tick", () => {
    const state = { ...createInitialState(), tick: 42 };
    const pid = state.processes[0].pid;
    const { state: next } = simulatePageFault(state, pid, 0);
    expect(next.processes.find(p => p.pid === pid)?.blockedTick).toBe(42);
  });

  test("returns error for unknown PID", () => {
    const state = createInitialState();
    const { message } = simulatePageFault(state, 9999, 0);
    expect(message).toContain("unknown PID");
  });

  test("returns error for terminated process", () => {
    let state = createInitialState();
    const pid = state.processes[0].pid;
    state = { ...state, processes: state.processes.map(p => p.pid === pid ? { ...p, state: "TERMINATED" as const } : p) };
    const { message } = simulatePageFault(state, pid, 0);
    expect(message).toContain("terminated");
  });
});

describe("resolvePageFault", () => {
  test("unblocks a blocked process", () => {
    let state = createInitialState();
    const pid = state.processes[0].pid;
    const { state: blocked } = simulatePageFault(state, pid, 0);
    const resolved = resolvePageFault(blocked, pid);
    expect(resolved.processes.find(p => p.pid === pid)?.state).toBe("READY");
  });

  test("sets readyTick on resolution", () => {
    let state = { ...createInitialState(), tick: 50 };
    const pid = state.processes[0].pid;
    const { state: blocked } = simulatePageFault(state, pid, 0);
    const resolved = resolvePageFault(blocked, pid);
    expect(resolved.processes.find(p => p.pid === pid)?.readyTick).toBe(50);
  });
});

describe("memoryStats", () => {
  test("returns correct stats for empty memory", () => {
    const mem = createInitialMemoryState();
    const stats = memoryStats(mem);
    expect(stats.used).toBe(0);
    expect(stats.total).toBe(256);
    expect(stats.totalFree).toBe(256);
    expect(stats.largestFreeBlock).toBe(256);
    expect(stats.fragPct).toBe(0);
  });

  test("returns correct stats with allocations", () => {
    const mem = createInitialMemoryState();
    const { memory } = allocateFrames(mem, 1, 64);
    const stats = memoryStats(memory);
    expect(stats.used).toBe(64);
    expect(stats.fragPct).toBe(0);
  });
});
