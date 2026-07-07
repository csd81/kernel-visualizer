import type { SimState, HistoryEntry } from "@/types/sim";
import type { MemoryState } from "@/types/memory";
import type { DiskState } from "@/types/filesystem";
import { processColor } from "./colors";
import type { Process, ProcessState } from "@/types/process";

export function createInitialMemoryState(): MemoryState {
  return {
    frames: Array.from({ length: 256 }, (_, i) => ({ id: i, pid: null })),
    algorithm: "first-fit",
    faultFlash: false,
  };
}

export function createInitialDiskState(): DiskState {
  const blocks = Array.from({ length: 128 }, (_, i) => {
    let type: "BOOT" | "SUPERBLOCK" | "INODE_TABLE" | "DATA" = "DATA";
    if (i === 0) type = "BOOT";
    else if (i === 1) type = "SUPERBLOCK";
    else if (i >= 2 && i <= 5) type = "INODE_TABLE";
    return { id: i, type, used: type !== "DATA", pid: null, fileId: null };
  });
  return {
    blocks,
    inodes: Array.from({ length: 4 }, (_, i) => ({
      id: i, used: false, fileName: null, size: 0, blocks: [], pid: null,
    })),
  };
}

function createInitialProcess(pid: number, ticks: number, priority: number): Process {
  return {
    pid, state: "READY" as ProcessState,
    totalTicks: ticks, remainingTicks: ticks, priority,
    readyTick: 0, totalRunTicks: 0,
    currentQuantumTicks: 0, ticksSinceRun: 0, blockedTick: 0, mlfqLevel: 0,
    color: processColor(pid), pageTable: [], holds: [], waitsFor: -1,
  };
}

export function createInitialState(): SimState {
  return {
    tick: 0,
    running: false,
    viewTick: -1,
    speed: 500,
    scheduler: "fcfs",
    quantum: 3,
    agingThreshold: 20,
    ticksSinceBoost: 0,
    nextPid: 4,
    processes: [
      createInitialProcess(1, 10, 2),
      createInitialProcess(2, 8, 1),
      createInitialProcess(3, 15, 0),
    ],
    history: [],
    memory: createInitialMemoryState(),
    disk: createInitialDiskState(),
    terminal: {
      output: [
        { id: 1, text: "╔══════════════════════════════════════╗", type: "info" as const },
        { id: 2, text: "║   Kernel Visualizer v1.0              ║", type: "info" as const },
        { id: 3, text: "║   Interactive OS Simulator           ║", type: "info" as const },
        { id: 4, text: "║                                      ║", type: "info" as const },
        { id: 5, text: "║   Type 'help' to get started.         ║", type: "info" as const },
        { id: 6, text: "╚══════════════════════════════════════╝", type: "info" as const },
      ],
      history: [],
      historyIndex: -1,
    },
    stats: {
      contextSwitches: 0,
      pageFaults: 0,
      cpuUtil: [],
      memoryPressure: [],
      diskUsage: [],
    },
    deadlockedPids: [],
  };
}

/** Reconstruct SimState as it appeared at a given tick by replaying history. */
export function reconstructStateAt(
  initialState: SimState,
  history: HistoryEntry[],
  targetTick: number
): SimState {
  if (targetTick < 0) return { ...initialState, viewTick: -1 };

  let state: SimState = {
    ...initialState,
    processes: initialState.processes.map(p => ({ ...p })),
    memory: { ...initialState.memory, frames: initialState.memory.frames.map(f => ({ ...f })) },
    disk: { ...initialState.disk, blocks: initialState.disk.blocks.map(b => ({ ...b })), inodes: initialState.disk.inodes.map(i => ({ ...i })) },
  };

  const events = history.filter(h => h.tick <= targetTick);

  for (let tick = 0; tick <= targetTick; tick++) {
    const tickEvents = events.filter(h => h.tick === tick);
    state = { ...state, tick };

    for (const event of tickEvents) {
      switch (event.event) {
        case "scheduled": {
          state = {
            ...state,
            processes: state.processes.map(p =>
              p.pid === event.pid
                ? { ...p, state: "RUNNING" as const, currentQuantumTicks: 0 }
                : p.state === "RUNNING"
                  ? { ...p, state: "READY" as const }
                  : p
            ),
            stats: { ...state.stats, contextSwitches: state.stats.contextSwitches + 1 },
          };
          break;
        }
        case "terminated": {
          state = {
            ...state,
            processes: state.processes.map(p =>
              p.pid === event.pid ? { ...p, state: "TERMINATED" as const, terminatedTick: tick } : p
            ),
          };
          break;
        }
        case "preempted": {
          state = {
            ...state,
            processes: state.processes.map(p =>
              p.pid === event.pid
                ? { ...p, state: "READY" as const, readyTick: tick, currentQuantumTicks: 0 }
                : p
            ),
          };
          break;
        }
        case "blocked": {
          state = {
            ...state,
            processes: state.processes.map(p =>
              p.pid === event.pid ? { ...p, state: "BLOCKED" as const, blockedTick: tick } : p
            ),
          };
          break;
        }
      }
    }
  }

  return { ...state, viewTick: targetTick, running: false };
}

export function tick(state: SimState): SimState {
  return {
    ...state,
    tick: state.tick + 1,
  };
}
