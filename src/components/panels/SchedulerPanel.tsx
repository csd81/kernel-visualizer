"use client";

import { useSimulation } from "@/hooks/SimulationContext";
import QueueLane from "../scheduler/QueueLane";
import AlgorithmSelector from "../scheduler/AlgorithmSelector";
import ProcessTable from "../scheduler/ProcessTable";
import GanttChart from "../scheduler/GanttChart";
import StatTile from "../shared/StatTile";

export default function SchedulerPanel() {
  const { state } = useSimulation();
  const running = state.processes.find(p => p.state === "RUNNING");
  const ready = state.processes.filter(p => p.state === "READY");
  const blocked = state.processes.filter(p => p.state === "BLOCKED");

  // Build file count map from disk inodes
  const fileCounts: Record<number, number> = {};
  for (const inode of state.disk.inodes) {
    if (inode.pid !== null) fileCounts[inode.pid] = (fileCounts[inode.pid] || 0) + 1;
  }

  const cpuUtil = state.stats.cpuUtil.length > 0
    ? Math.round(state.stats.cpuUtil.reduce((a, b) => a + b, 0) / state.stats.cpuUtil.length)
    : 0;

  return (
    <section className="rounded-xl bg-white/3 backdrop-blur-xl border border-white/6 p-3 lg:p-5
      [border-color:var(--color-accent-scheduler)]/30
      hover:[border-color:var(--color-accent-scheduler)]/60 transition-colors">
      <h2 className="text-[10px] lg:text-xs uppercase tracking-[0.12em] text-text-muted mb-2 lg:mb-3">
        ⚡ Scheduler
      </h2>
      <AlgorithmSelector />

      <QueueLane label="RUNNING" processes={running ? [running] : []} variant="running" quantum={state.scheduler === "rr" ? state.quantum : undefined} deadlockedPids={state.deadlockedPids} />
      <QueueLane label="READY" processes={ready} deadlockedPids={state.deadlockedPids} />
      {blocked.length > 0 && <QueueLane label="BLOCKED" processes={blocked} />}

      <div className="flex gap-2 flex-wrap mb-2">
        <StatTile icon="⚡" label="CPU" value={`${cpuUtil}%`} sparkline={state.stats.cpuUtil} sparkColor="#00e5ff" warn={cpuUtil > 80} critical={cpuUtil > 95} />
        <StatTile icon="⤵" label="CTX" value={state.stats.contextSwitches} />
        <StatTile icon="⏱" label="Ticks" value={state.tick} />
      </div>

      <details className="mt-2 group">
        <summary className="text-[9px] lg:text-[10px] uppercase tracking-wider text-text-muted cursor-pointer hover:text-text-secondary transition-colors">
          Process Table ({state.processes.length})
        </summary>
        <div className="mt-1.5">
          <ProcessTable processes={state.processes} fileCounts={fileCounts} />
        </div>
      </details>

      <details className="mt-2 group">
        <summary className="text-[9px] lg:text-[10px] uppercase tracking-wider text-text-muted cursor-pointer hover:text-text-secondary transition-colors">
          Timeline — CPU: {cpuUtil}%
        </summary>
        <GanttChart history={state.history} />
      </details>
    </section>
  );
}
