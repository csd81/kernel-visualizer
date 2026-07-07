import type { MemoryState, Frame, PageTableEntry } from "@/types/memory";
import type { SimState } from "@/types/sim";

export const TOTAL_FRAMES = 256;

export function firstFit(frames: Frame[], sizeKb: number): number {
  let start = -1, count = 0;
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].pid === null) {
      if (start === -1) start = i;
      count++;
      if (count >= sizeKb) return start;
    } else {
      start = -1;
      count = 0;
    }
  }
  return -1;
}

export function bestFit(frames: Frame[], sizeKb: number): number {
  let bestStart = -1, bestSize = Infinity, i = 0;
  while (i < frames.length) {
    if (frames[i].pid === null) {
      const start = i;
      let count = 0;
      while (i < frames.length && frames[i].pid === null) { count++; i++; }
      if (count >= sizeKb && count < bestSize) { bestStart = start; bestSize = count; }
    } else i++;
  }
  return bestStart;
}

export function allocateFrames(
  state: MemoryState, pid: number, sizeKb: number
): { memory: MemoryState; allocated: number[]; message: string | null } {
  const frames = state.frames.map(f => ({ ...f }));
  const fn = state.algorithm === "best-fit" ? bestFit : firstFit;
  const start = fn(frames, sizeKb);
  if (start === -1) {
    const totalFree = frames.filter(f => f.pid === null).length;
    const largest = largestFreeBlock(frames);
    return { memory: state, allocated: [], message: `insufficient contiguous memory (${largest} KB largest, ${totalFree} KB total free)` };
  }
  const allocated: number[] = [];
  for (let i = start; i < start + sizeKb; i++) {
    frames[i] = { ...frames[i], pid };
    allocated.push(i);
  }
  return { memory: { ...state, frames, faultFlash: false }, allocated, message: null };
}

export function freeProcessFrames(state: MemoryState, pid: number): MemoryState {
  return {
    ...state,
    frames: state.frames.map(f => f.pid === pid ? { ...f, pid: null } : f),
  };
}

export function largestFreeBlock(frames: Frame[]): number {
  let max = 0, cur = 0;
  for (const f of frames) {
    if (f.pid === null) { cur++; max = Math.max(max, cur); }
    else cur = 0;
  }
  return max;
}

export function memoryStats(state: MemoryState) {
  const totalFree = state.frames.filter(f => f.pid === null).length;
  const largest = largestFreeBlock(state.frames);
  const used = TOTAL_FRAMES - totalFree;
  const fragPct = totalFree > 0 ? Math.round((1 - largest / totalFree) * 100) : 0;
  return { used, total: TOTAL_FRAMES, totalFree, largestFreeBlock: largest, fragPct };
}

// ─── Page Table ──────────────────────────────────────────────────────

export function buildPageTable(allocated: number[]): PageTableEntry[] {
  return allocated.map((frameNum, i) => ({
    logicalPage: i,
    frameNum,
    present: true,
  }));
}

// ─── Page Fault Simulation ───────────────────────────────────────────

export function simulatePageFault(
  simState: SimState,
  pid: number,
  logicalPage: number
): { state: SimState; message: string } {
  const proc = simState.processes.find(p => p.pid === pid);
  if (!proc) return { state: simState, message: `Error: unknown PID ${pid}` };
  if (proc.state === "TERMINATED") return { state: simState, message: `Error: PID ${pid} is terminated` };

  const processes = simState.processes.map(p =>
    p.pid === pid
      ? { ...p, state: "BLOCKED" as const, blockedTick: simState.tick }
      : p
  );

  const pageFaults = simState.stats.pageFaults + 1;

  return {
    state: {
      ...simState,
      processes,
      memory: { ...simState.memory, faultFlash: true },
      stats: { ...simState.stats, pageFaults },
    },
    message: `⚠️ PAGE FAULT — PID ${pid} page ${logicalPage} (total: ${pageFaults})`,
  };
}

export function resolvePageFault(simState: SimState, pid: number): SimState {
  return {
    ...simState,
    processes: simState.processes.map(p =>
      p.pid === pid && p.state === "BLOCKED"
        ? { ...p, state: "READY" as const, readyTick: simState.tick }
        : p
    ),
  };
}
