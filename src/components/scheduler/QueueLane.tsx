"use client";

import type { Process } from "@/types/process";
import ProcessCard from "./ProcessCard";

interface Props {
  label: string;
  processes: Process[];
  variant?: "queue" | "running";
  quantum?: number;
  deadlockedPids?: number[];
}

export default function QueueLane({ label, processes, variant = "queue", quantum, deadlockedPids = [] }: Props) {
  return (
    <div className="mb-2 lg:mb-3">
      <div className="text-[9px] lg:text-[10px] uppercase tracking-wider text-text-muted mb-1">
        {label} <span className="text-text-secondary">({processes.length})</span>
      </div>
      <div className="flex gap-1.5 lg:gap-2 overflow-x-auto pb-1 min-h-[50px] lg:min-h-[60px] items-center">
        {processes.length === 0 && (
          <span className="text-text-muted text-[9px] lg:text-[10px] italic">empty</span>
        )}
        {processes.map(p => (
          <ProcessCard
            key={p.pid}
            process={p}
            variant={variant}
            quantum={quantum}
            isDeadlocked={deadlockedPids.includes(p.pid)}
          />
        ))}
      </div>
    </div>
  );
}
