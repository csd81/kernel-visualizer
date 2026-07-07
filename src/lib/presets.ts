import type { SimState } from "@/types/sim";
import { createInitialState } from "./sim";
import { fork } from "./scheduler";
import { allocateFrames } from "./memory";
import { createFile, deleteFile } from "./filesystem";

export function exportState(state: SimState): string {
  return JSON.stringify({ version: 1, exportedAt: Date.now(), ...state }, null, 2);
}

export function importState(json: string): { state: SimState | null; error: string | null } {
  try {
    const data = JSON.parse(json);
    if (data.version === undefined || data.processes === undefined) {
      return { state: null, error: "Invalid state file" };
    }
    return { state: data as SimState, error: null };
  } catch {
    return { state: null, error: "Invalid JSON" };
  }
}

export type PresetName = "empty" | "cpu-demo" | "memory-pressure" | "disk-frag" | "deadlock";

export function loadPreset(_state: SimState, name: PresetName): SimState {
  switch (name) {
    case "empty":
      return createInitialState();
    case "cpu-demo": {
      let s = createInitialState();
      for (let i = 0; i < 6; i++) {
        const r = fork(s, 5 + i * 3, i < 2 ? 9 : 3);
        s = r.state;
      }
      return { ...s, scheduler: "rr" as const, quantum: 3, running: true };
    }
    case "memory-pressure": {
      let s = createInitialState();
      s = fork(s, 10, 5).state;
      const r = allocateFrames(s.memory, 1, Math.floor(256 * 0.8));
      if (!r.message) s = { ...s, memory: r.memory };
      return { ...s, running: true };
    }
    case "disk-frag": {
      let s = createInitialState();
      s = { ...s, disk: createFile(s.disk, "a.txt", 10).disk };
      s = { ...s, disk: createFile(s.disk, "b.txt", 15).disk };
      s = { ...s, disk: deleteFile(s.disk, "a.txt").disk };
      s = { ...s, disk: createFile(s.disk, "c.txt", 8).disk };
      return { ...s, running: true };
    }
    case "deadlock": {
      let s = createInitialState();
      s = fork(s, 30, 5).state;
      s = fork(s, 30, 5).state;
      const r1 = allocateFrames(s.memory, 1, 1);
      if (!r1.message) s = { ...s, memory: r1.memory };
      const r2 = allocateFrames(s.memory, 2, 1);
      if (!r2.message) s = { ...s, memory: r2.memory };
      s.processes = s.processes.map(p => {
        if (p.pid === 1) return { ...p, state: "BLOCKED" as const, waitsFor: 2, holds: r1.message ? [] : [r1.allocated[0]] };
        if (p.pid === 2) return { ...p, state: "BLOCKED" as const, waitsFor: 1, holds: r2.message ? [] : [r2.allocated[0]] };
        return p;
      });
      return { ...s, running: true };
    }
    default:
      return _state;
  }
}
