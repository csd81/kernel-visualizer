export type ProcessState = "READY" | "RUNNING" | "BLOCKED" | "TERMINATED";

export interface PageTableEntry {
  logicalPage: number;
  frameNum: number;
  present: boolean;
}

export interface Process {
  pid: number;
  state: ProcessState;
  totalTicks: number;
  remainingTicks: number;
  priority: number;
  /** Tick when this process last entered the READY queue (for FIFO ordering) */
  readyTick: number;
  totalRunTicks: number;
  /** Ticks spent running in the current RR/Priority quantum window */
  currentQuantumTicks: number;
  /** Ticks since this process last ran (for aging) */
  ticksSinceRun: number;
  /** Tick when this process entered BLOCKED state */
  blockedTick: number;
  /** MLFQ queue level: 0=highest, 2=lowest */
  mlfqLevel: number;
  color: string;
  pageTable: PageTableEntry[];
  holds: number[];
  /** PID this process is waiting for, or -1 if none */
  waitsFor: number;
  terminatedTick?: number;
}
