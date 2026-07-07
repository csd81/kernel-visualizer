"use client";

import { useRef, useEffect, memo, useCallback } from "react";
import type { HistoryEntry } from "@/types/sim";
import { processColor } from "@/lib/colors";

interface Props {
  history: HistoryEntry[];
  tickWidth?: number;
  rowHeight?: number;
  viewTick?: number;
  onScrub?: (tick: number) => void;
}

function GanttChartInner({ history, tickWidth = 6, rowHeight = 18, viewTick = -1, onScrub }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScrub = useCallback((clientX: number) => {
    if (!scrollRef.current || !onScrub) return;
    const rect = scrollRef.current.getBoundingClientRect();
    const x = clientX - rect.left + scrollRef.current.scrollLeft - 35;
    const tick = Math.max(0, Math.round(x / tickWidth));
    onScrub(tick);
  }, [tickWidth, onScrub]);

  const withDuration = history.filter(h => h.duration && h.duration > 0);
  const pids = [...new Set(withDuration.map(h => h.pid))];
  const maxTick = withDuration.reduce((m, h) => Math.max(m, h.tick + (h.duration || 0)), 0);
  const width = Math.max(maxTick * tickWidth + 100, 300);
  const height = pids.length * rowHeight + 20;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [history.length]);

  if (withDuration.length === 0) {
    return <div className="text-[10px] text-text-muted italic mt-2">No history yet</div>;
  }

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto mt-2 cursor-pointer"
      onMouseDown={e => handleScrub(e.clientX)}
      onMouseMove={e => e.buttons === 1 && handleScrub(e.clientX)}
    >
      <svg width={width} height={height} className="font-mono select-none">
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
        {/* Scrubber vertical line */}
        {viewTick >= 0 && (
          <line
            x1={viewTick * tickWidth + 35}
            y1={0}
            x2={viewTick * tickWidth + 35}
            y2={height}
            stroke="#fff"
            strokeWidth={1}
            strokeOpacity={0.4}
            strokeDasharray="3 3"
          />
        )}
      </svg>
    </div>
  );
}

export default memo(GanttChartInner, (prev, next) =>
  prev.history.length === next.history.length && prev.viewTick === next.viewTick
);
