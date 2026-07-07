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
  arrivalTick: number;
  totalRunTicks: number;
  currentQuantumTicks: number;
  ticksSinceRun: number;
  blockedTick: number;
  mlfqLevel: number;
  color: string;
  pageTable: PageTableEntry[];
  holds: number[];
  waitsFor: number;
}
