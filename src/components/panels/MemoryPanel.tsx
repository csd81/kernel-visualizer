"use client";

import { useState } from "react";
import { useSimulation } from "@/hooks/SimulationContext";
import FrameGrid from "../memory/FrameGrid";
import FrameDetail from "../memory/FrameDetail";
import StatTile from "../shared/StatTile";
import type { Frame } from "@/types/memory";
import { memoryStats } from "@/lib/memory";

export default function MemoryPanel() {
  const { state, setMemAlgorithm } = useSimulation();
  const [selected, setSelected] = useState<Frame | null>(null);
  const stats = memoryStats(state.memory);

  const memPct = Math.round((stats.used / stats.total) * 100);

  return (
    <section className="rounded-xl bg-white/3 backdrop-blur-xl border border-white/6 p-3 lg:p-5
      [border-color:var(--color-accent-memory)]/30
      hover:[border-color:var(--color-accent-memory)]/60 transition-colors">
      <h2 className="text-[10px] lg:text-xs uppercase tracking-[0.12em] text-text-muted mb-2 lg:mb-3">
        📦 Memory
      </h2>

      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <select
          value={state.memory.algorithm}
          onChange={e => setMemAlgorithm(e.target.value as "first-fit" | "best-fit")}
          className="bg-white/6 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-text-primary"
        >
          <option value="first-fit">First Fit</option>
          <option value="best-fit">Best Fit</option>
        </select>
        {state.stats.pageFaults > 0 && (
          <span className="text-[10px] text-red-400 font-mono">⚠ PF: {state.stats.pageFaults}</span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap mb-2">
        <StatTile icon="📦" label="Used" value={`${stats.used}/${stats.total}`} sparkline={state.stats.memoryPressure} sparkColor="#d500f9" warn={memPct > 80} critical={memPct > 95} />
        <StatTile icon="📊" label="Frag" value={`${stats.fragPct}%`} warn={stats.fragPct > 50} critical={stats.fragPct > 75} />
      </div>

      <FrameGrid frames={state.memory.frames} onSelect={setSelected} flash={state.memory.faultFlash} />
      <FrameDetail frame={selected} processes={state.processes} />
    </section>
  );
}
