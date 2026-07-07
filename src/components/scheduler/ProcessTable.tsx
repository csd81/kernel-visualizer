"use client";

import React from "react";
import type { Process } from "@/types/process";

interface Props {
  processes: Process[];
  fileCounts?: Record<number, number>;
}

const STATE_COLORS: Record<string, string> = {
  READY: "text-blue-400",
  RUNNING: "text-green-400",
  BLOCKED: "text-yellow-400",
  TERMINATED: "text-red-400",
};

function ProcessTableInner({ processes, fileCounts = {} }: Props) {
  return (
    <table className="w-full text-[10px] lg:text-xs font-mono">
      <thead>
        <tr className="text-text-muted uppercase tracking-wider">
          <th className="text-left py-1 pr-2">PID</th>
          <th className="text-left py-1 pr-2">State</th>
          <th className="text-left py-1 pr-2">Ticks</th>
          <th className="text-left py-1 pr-2">Pri</th>
          <th className="text-left py-1 pr-2">Mem</th>
          <th className="text-left py-1">Files</th>
        </tr>
      </thead>
      <tbody>
        {processes.map(p => (
          <tr key={p.pid} className="border-t border-white/5">
            <td className="py-1 pr-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: p.color }} />
              {p.pid}
            </td>
            <td className={`py-1 pr-2 ${STATE_COLORS[p.state]}`}>{p.state}</td>
            <td className="py-1 pr-2">{p.remainingTicks}/{p.totalTicks}</td>
            <td className="py-1 pr-2">{p.priority}</td>
            <td className="py-1 pr-2">{p.holds.length}</td>
            <td className="py-1">{fileCounts[p.pid] ?? 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default React.memo(ProcessTableInner);
