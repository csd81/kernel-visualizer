import type { SimState } from "@/types/sim";
import type { MemoryState } from "@/types/memory";
import type { DiskState } from "@/types/filesystem";

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

export function createInitialState(): SimState {
  return {
    tick: 0,
    running: false,
    speed: 500,
    scheduler: "fcfs",
    quantum: 3,
    agingThreshold: 20,
    ticksSinceBoost: 0,
    nextPid: 1,
    processes: [],
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

export function tick(state: SimState): SimState {
  return {
    ...state,
    tick: state.tick + 1,
  };
}
