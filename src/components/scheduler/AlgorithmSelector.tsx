"use client";

import { useSimulation } from "@/hooks/SimulationContext";
import type { SchedAlgorithm } from "@/types/sim";

export default function AlgorithmSelector() {
  const { state, setScheduler, setQuantum, setAgingThreshold } = useSimulation();

  return (
    <div className="flex items-center flex-wrap gap-2 mb-2 lg:mb-3">
      <select
        value={state.scheduler}
        onChange={e => setScheduler(e.target.value as SchedAlgorithm)}
        className="bg-white/6 border border-white/10 rounded px-1.5 lg:px-2 py-1 text-[10px] lg:text-xs font-mono text-text-primary"
      >
        <option value="fcfs">FCFS</option>
        <option value="rr">Round Robin</option>
        <option value="priority">Priority</option>
        <option value="mlfq">MLFQ</option>
      </select>

      {state.scheduler === "rr" && (
        <label className="flex items-center gap-1 text-[9px] lg:text-[10px] text-text-secondary">
          Quantum
          <input
            type="number" min={1} max={20} value={state.quantum}
            onChange={e => setQuantum(Number(e.target.value))}
            className="w-10 lg:w-12 bg-white/6 border border-white/10 rounded px-1 py-0.5 text-[10px] lg:text-xs font-mono text-text-primary"
          />
          ticks
        </label>
      )}

      {state.scheduler === "priority" && (
        <label className="flex items-center gap-1 text-[9px] lg:text-[10px] text-text-secondary">
          Aging
          <input
            type="number" min={5} max={100} value={state.agingThreshold}
            onChange={e => setAgingThreshold(Number(e.target.value))}
            className="w-10 lg:w-12 bg-white/6 border border-white/10 rounded px-1 py-0.5 text-[10px] lg:text-xs font-mono text-text-primary"
          />
          ticks
        </label>
      )}
    </div>
  );
}
