import type { Process } from "./process";
import type { MemoryState } from "./memory";
import type { DiskState } from "./filesystem";

export type SchedAlgorithm = "fcfs" | "rr" | "priority" | "mlfq";

export interface HistoryEntry {
  tick: number;
  pid: number;
  event: "scheduled" | "preempted" | "terminated" | "blocked";
  duration?: number;
}

export interface SimStats {
  contextSwitches: number;
  pageFaults: number;
  cpuUtil: number[];
  memoryPressure: number[];
  diskUsage: number[];
}

export interface TerminalState {
  output: { id: number; text: string; type: "input" | "output" | "info" | "success" | "error" | "warning" }[];
  history: string[];
  historyIndex: number;
}

export interface SimState {
  tick: number;
  running: boolean;
  speed: number;
  scheduler: SchedAlgorithm;
  quantum: number;
  agingThreshold: number;
  ticksSinceBoost: number;
  nextPid: number;
  processes: Process[];
  history: HistoryEntry[];
  memory: MemoryState;
  disk: DiskState;
  terminal: TerminalState;
  stats: SimStats;
  deadlockedPids: number[];
}
