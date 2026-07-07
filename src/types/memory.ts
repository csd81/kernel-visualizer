export interface Frame {
  id: number;
  pid: number | null;
}

export interface MemoryState {
  frames: Frame[];
  algorithm: "first-fit" | "best-fit";
  faultFlash: boolean;
}

export interface PageTableEntry {
  logicalPage: number;
  frameNum: number;
  present: boolean;
}
