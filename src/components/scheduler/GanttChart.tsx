"use client";

import { useRef, useEffect, memo } from "react";
import type { HistoryEntry } from "@/types/sim";
import { processColor } from "@/lib/colors";

interface Props {
  history: HistoryEntry[];
  tickWidth?: number;
  rowHeight?: number;
}

function GanttChartInner({ history, tickWidth = 6, rowHeight = 18 }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const withDuration = history.filter(h => h.duration && h.duration > 0);
  const pids = [...new Set(withDuration.map(h => h.pid))];
  const maxTick = withDuration.reduce((m, h) => Math.max(m, h.tick + (h.duration || 0)), 0);
  const width = Math.max(maxTick * tickWidth + 100, 300);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [history.length]);

  if (withDuration.length === 0) {
    return <div className="text-[10px] text-text-muted italic mt-2">No history yet</div>;
  }

  return (
    <div ref={scrollRef} className="overflow-x-auto mt-2">
      <svg width={width} height={pids.length * rowHeight + 20} className="font-mono">
        {pids.map((pid, i) => (
          <text key={pid} x={4} y={i * rowHeight + rowHeight / 2 + 3} fontSize={9} fill="var(--color-text-secondary)">
            PID {pid}
          </text>
        ))}
        {withDuration.map((h, i) => {
          const row = pids.indexOf(h.pid);
          return (
            <g key={i}>
              <rect
                x={h.tick * tickWidth + 35}
                y={row * rowHeight + 2}
                width={Math.max(h.duration! * tickWidth, 2)}
                height={rowHeight - 4}
                rx={2}
                fill={processColor(h.pid)}
                fillOpacity={0.7}
              >
                <title>PID {h.pid} — {h.duration!} ticks (tick {h.tick}–{h.tick + h.duration!})</title>
              </rect>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default memo(GanttChartInner, (prev, next) => prev.history.length === next.history.length);
