"use client";

import type { Process } from "@/types/process";

interface Props {
  process: Process;
  variant?: "queue" | "running" | "compact";
  quantum?: number;
  isDeadlocked?: boolean;
}

export default function ProcessCard({ process, variant = "queue", quantum, isDeadlocked }: Props) {
  const sizeClasses = variant === "running"
    ? "p-2.5 lg:p-3 min-w-[100px] lg:min-w-[120px]"
    : variant === "compact"
    ? "p-1.5 text-[10px]"
    : "p-2 min-w-[70px] lg:min-w-[80px]";

  return (
    <div
      className={`relative rounded-lg bg-white/6 border-l-[3px] text-[10px] lg:text-xs font-mono transition-all duration-300 shrink-0
        ${sizeClasses}
        ${process.state === "RUNNING" ? "animate-pulse-glow" : ""}
        ${process.state === "TERMINATED" ? "opacity-0 scale-90 translate-y-2 pointer-events-none" : "opacity-100"}
        ${process.state === "BLOCKED" ? "opacity-50 grayscale" : ""}
        ${isDeadlocked ? "ring-2 ring-red-500" : ""}
        hover:scale-105`}
      style={{ borderLeftColor: process.color }}
      title={`PID ${process.pid} — ${process.state} — ${process.remainingTicks}/${process.totalTicks} ticks — pri ${process.priority}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: process.color }} />
        <span className="font-semibold">PID {process.pid}</span>
      </div>
      <div className="text-text-muted mt-0.5">
        {process.remainingTicks}/{process.totalTicks}
      </div>
      {variant === "running" && (
        <div className="text-[9px] lg:text-[10px] text-text-muted mt-0.5">pri {process.priority}</div>
      )}

      {/* Quantum countdown ring (RR mode) */}
      {variant === "running" && quantum !== undefined && quantum > 0 && (
        <svg className="absolute top-1 right-1 w-5 h-5 lg:w-6 lg:h-6" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
          <circle
            cx="18" cy="18" r="16" fill="none"
            stroke={process.color}
            strokeWidth="2" strokeDasharray="100"
            strokeDashoffset={100 - (process.currentQuantumTicks / quantum) * 100}
            strokeLinecap="round" transform="rotate(-90 18 18)"
          />
        </svg>
      )}

      {isDeadlocked && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[8px] flex items-center justify-center text-white font-bold">!</div>
      )}
    </div>
  );
}
