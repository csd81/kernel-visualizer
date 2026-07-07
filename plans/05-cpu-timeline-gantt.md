# Phase 5 — CPU Timeline / Gantt Chart

## Goal
Render a horizontal Gantt chart showing CPU execution history. Each process gets a colored bar per run interval. Hover shows pid + duration.

## Prerequisites
- Phase 3 or 4 (scheduler producing history entries)

## Tasks

### 1. Enriched history entries

**File: `src/types/sim.ts`**

```ts
export interface HistoryEntry {
  tick: number;
  pid: number;
  event: "scheduled" | "preempted" | "terminated" | "blocked";
  duration?: number;  // filled when the event closes
}
```

**File: `src/lib/scheduler.ts`** — when a process is preempted or terminates, update its previous "scheduled" entry with `duration = currentTick - scheduledTick`.

Track `lastScheduledTick` per process or find the last `scheduled` entry in history and patch it.

### 2. Gantt chart component

**File: `src/components/scheduler/GanttChart.tsx`**

```tsx
"use client";

import { useRef, useEffect } from "react";
import type { HistoryEntry } from "@/types/sim";
import { processColor } from "@/lib/colors";

interface Props {
  history: HistoryEntry[];
  tickWidth?: number;
  rowHeight?: number;
}

export default function GanttChart({ history, tickWidth = 6, rowHeight = 20 }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get unique PIDs in order of first appearance
  const pids = [...new Set(history.map(h => h.pid))];
  const maxTick = history.reduce((m, h) => Math.max(m, h.tick + (h.duration || 0)), 0);
  const width = Math.max(maxTick * tickWidth + 100, 400);

  // Auto-scroll to latest
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [history.length]);

  return (
    <div ref={scrollRef} className="overflow-x-auto mt-3">
      <svg width={width} height={pids.length * rowHeight + 20} className="font-mono">
        {/* Y-axis labels */}
        {pids.map((pid, i) => (
          <text key={pid} x={4} y={i * rowHeight + rowHeight / 2 + 4} fontSize={10} fill="var(--color-text-secondary)">
            PID {pid}
          </text>
        ))}
        {/* Bars */}
        {history.filter(h => h.duration && h.duration > 0).map((h, i) => {
          const row = pids.indexOf(h.pid);
          return (
            <g key={i}>
              <rect
                x={h.tick * tickWidth + 40}
                y={row * rowHeight + 2}
                width={h.duration! * tickWidth}
                height={rowHeight - 4}
                rx={3}
                fill={processColor(h.pid)}
                fillOpacity={0.7}
              >
                <title>PID {h.pid} — {h.duration} ticks (tick {h.tick}–{h.tick + h.duration})</title>
              </rect>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
```

### 3. CPU utilization

Compute and display `"CPU Util: X%"` where X = percentage of ticks where at least one process was RUNNING.

```ts
export function computeCpuUtil(history: HistoryEntry[], totalTicks: number): number {
  if (totalTicks === 0) return 0;
  const runningTicks = new Set(history.filter(h => h.event === "scheduled").map(h => h.tick));
  return Math.round((runningTicks.size / totalTicks) * 100);
}
```

Display below the Gantt chart as a compact stat.

### 4. Wire into SchedulerPanel

Add the Gantt chart and CPU utilization below the queue lanes in `SchedulerPanel.tsx`, wrapped in a `<details>` element so it's collapsible:

```tsx
<details className="mt-3">
  <summary className="text-[10px] uppercase tracking-wider text-text-muted cursor-pointer hover:text-text-secondary">
    Timeline — CPU: {cpuUtil}%
  </summary>
  <GanttChart history={state.history} />
</details>
```

## Acceptance Criteria
- [ ] Gantt chart shows colored horizontal bars per PID
- [ ] Each bar's width = duration in ticks * tickWidth
- [ ] Hover over a bar shows tooltip with PID, duration, tick range
- [ ] Auto-scrolls to follow the latest bar
- [ ] CPU Util % updates every tick
- [ ] Responsive: chart scrolls horizontally within the panel

## Files Touched
- `src/types/sim.ts` — HistoryEntry with duration
- `src/lib/scheduler.ts` — patch duration on preempt/terminate
- `src/components/scheduler/GanttChart.tsx` — new
- `src/lib/sim.ts` — computeCpuUtil helper
- `src/components/panels/SchedulerPanel.tsx` — Gantt + CPU util
