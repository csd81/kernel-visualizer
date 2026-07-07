"use client";

import { createContext, useContext } from "react";
import type { SimState } from "@/types/sim";
import type { SchedAlgorithm } from "@/types/sim";

interface SimContextValue {
  state: SimState;
  start: () => void;
  stop: () => void;
  setSpeed: (ms: number) => void;
  setScheduler: (s: SchedAlgorithm) => void;
  setQuantum: (q: number) => void;
  setMemAlgorithm: (a: "first-fit" | "best-fit") => void;
  processCommand: (input: string) => void;
  loadPreset: (name: "empty" | "cpu-demo" | "memory-pressure" | "disk-frag" | "deadlock") => void;
  resetSim: () => void;
  downloadState: () => void;
}

export const SimulationContext = createContext<SimContextValue | null>(null);

export function useSimulation(): SimContextValue {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used within SimulationProvider");
  return ctx;
}
