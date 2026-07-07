# Phase 3 — FCFS Scheduler & Queue Visualization

## Goal
Implement First-Come-First-Served scheduling. Processes advance through READY → RUNNING → TERMINATED. Visual queue lanes with animated process cards.

## Prerequisites
- Phase 2 (process data model, process table)

## Tasks

### 1. FCFS schedule function

**File: `src/lib/scheduler.ts`**

Add `scheduleFcfs(state: SimState): SimState`:

```ts
export function scheduleFcfs(state: SimState): SimState {
  const processes = state.processes.map(p => ({ ...p })); // shallow clone
  let history = [...state.history];
  let contextSwitches = state.stats.contextSwitches;

  for (const proc of processes) {
    if (proc.state !== "RUNNING") continue;

    proc.remainingTicks--;
    proc.totalRunTicks++;

    if (proc.remainingTicks <= 0) {
      proc.state = "TERMINATED";
      history.push({ tick: state.tick, pid: proc.pid, event: "terminated" });
    }
    return {
      ...state,
      processes,
      history,
      stats: { ...state.stats, contextSwitches },
    };
  }

  // No running process — pick next READY (FIFO by arrivalTick)
  const next = processes
    .filter(p => p.state === "READY")
    .sort((a, b) => a.arrivalTick - b.arrivalTick)[0];

  if (next) {
    next.state = "RUNNING";
    contextSwitches++;
    history.push({ tick: state.tick, pid: next.pid, event: "scheduled" });
  }

  return {
    ...state,
    processes,
    history,
    stats: { ...state.stats, contextSwitches },
  };
}
```

### 2. Integrate into tick()

**File: `src/lib/sim.ts`**

Update the `tick()` function to call `scheduleFcfs`:

```ts
import { scheduleFcfs } from "./scheduler";

export function tick(state: SimState): SimState {
  let next = { ...state, tick: state.tick + 1 };
  next = scheduleFcfs(next);
  return next;
}
```

### 3. Process card component

**File: `src/components/scheduler/ProcessCard.tsx`**

```tsx
"use client";

import type { Process } from "@/types/process";

interface Props {
  process: Process;
  variant?: "queue" | "running" | "compact";
}

export default function ProcessCard({ process, variant = "queue" }: Props) {
  const sizeClasses = variant === "running"
    ? "p-3 min-w-[120px]"
    : variant === "compact"
    ? "p-1.5 text-[10px]"
    : "p-2 min-w-[80px]";

  return (
    <div
      className={`rounded-lg bg-white/6 border-l-[3px] text-xs font-mono transition-all duration-300 ${sizeClasses}
        ${process.state === "RUNNING" ? "animate-pulse-glow" : ""}
        ${process.state === "TERMINATED" ? "opacity-0 scale-90 translate-y-2" : "opacity-100"}
        ${process.state === "BLOCKED" ? "opacity-50 grayscale" : ""}`}
      style={{ borderLeftColor: process.color }}
    >
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: process.color }} />
        <span className="font-semibold">PID {process.pid}</span>
      </div>
      <div className="text-text-muted mt-0.5">
        {process.remainingTicks}/{process.totalTicks}
      </div>
      {variant === "running" && (
        <div className="text-[10px] text-text-muted mt-1">pri {process.priority}</div>
      )}
    </div>
  );
}
```

Add the pulse keyframe to `globals.css`:

```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 4px 0 rgba(0, 229, 255, 0.2); }
  50% { box-shadow: 0 0 12px 4px rgba(0, 229, 255, 0.4); }
}
.animate-pulse-glow {
  animation: pulse-glow 1.2s ease-in-out infinite;
}
```

### 4. Queue lane component

**File: `src/components/scheduler/QueueLane.tsx`**

```tsx
"use client";

import type { Process } from "@/types/process";
import ProcessCard from "./ProcessCard";

interface Props {
  label: string;
  processes: Process[];
  variant?: "queue" | "running";
}

export default function QueueLane({ label, processes, variant = "queue" }: Props) {
  return (
    <div className="mb-3">
      <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1.5">
        {label} ({processes.length})
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 min-h-[60px] items-center">
        {processes.length === 0 && (
          <span className="text-text-muted text-[10px] italic">empty</span>
        )}
        {processes.map(p => (
          <ProcessCard key={p.pid} process={p} variant={variant === "running" ? "running" : "queue"} />
        ))}
      </div>
    </div>
  );
}
```

### 5. Update SchedulerPanel with queue lanes

**File: `src/components/panels/SchedulerPanel.tsx`**

```tsx
"use client";

import { useSimulation } from "@/hooks/SimulationContext";
import QueueLane from "../scheduler/QueueLane";
import ProcessTable from "../scheduler/ProcessTable";

export default function SchedulerPanel() {
  const { state } = useSimulation();
  const running = state.processes.find(p => p.state === "RUNNING");
  const ready = state.processes.filter(p => p.state === "READY");
  const blocked = state.processes.filter(p => p.state === "BLOCKED");

  return (
    <section className="rounded-xl bg-white/3 backdrop-blur-xl border border-white/6 p-5
      [border-color:var(--color-accent-scheduler)]/30
      hover:[border-color:var(--color-accent-scheduler)]/60 transition-colors">
      <h2 className="text-xs uppercase tracking-[0.12em] text-text-muted mb-3">Scheduler</h2>

      <QueueLane label="RUNNING" processes={running ? [running] : []} variant="running" />
      <QueueLane label="READY" processes={ready} />
      {blocked.length > 0 && <QueueLane label="BLOCKED" processes={blocked} />}

      <details className="mt-3">
        <summary className="text-[10px] uppercase tracking-wider text-text-muted cursor-pointer hover:text-text-secondary">
          Process Table
        </summary>
        <div className="mt-2">
          <ProcessTable processes={state.processes} />
        </div>
      </details>
    </section>
  );
}
```

### 6. Mutable tick with cleanup

In the `tick()` function, after scheduling, run a cleanup pass to remove TERMINATED processes that have been done for more than a few ticks (so terminated cards fade out gracefully rather than vanishing instantly).

```ts
// After scheduling, defer cleanup
next = {
  ...next,
  processes: next.processes.filter(
    p => p.state !== "TERMINATED" || state.tick - p.arrivalTick < 3
  ),
};
```

### 7. Context switch logging

**File: `src/types/sim.ts`** — define `HistoryEntry`:

```ts
export interface HistoryEntry {
  tick: number;
  pid: number;
  event: "scheduled" | "terminated" | "preempted" | "blocked";
}

export interface SimStats {
  contextSwitches: number;
  pageFaults: number;
  cpuUtil: number[];
}
```

## Acceptance Criteria
- [x] Play → processes cycle READY → RUNNING → TERMINATED
- [x] RUNNING lane shows the active process card (pulse glow)
- [x] READY lane shows waiting processes in FIFO order
- [x] TERMINATED card fades out and disappears after 3 ticks
- [x] Each state transition is logged in history
- [x] Collapsible process table shows all details
- [x] Blocked processes appear in a third lane (none yet, but lane renders when populated)

## Files Touched
- `src/lib/scheduler.ts` — scheduleFcfs
- `src/lib/sim.ts` — integrate scheduler into tick
- `src/components/scheduler/ProcessCard.tsx` — new
- `src/components/scheduler/QueueLane.tsx` — new
- `src/components/panels/SchedulerPanel.tsx` — queue lanes
- `src/types/sim.ts` — HistoryEntry, SimStats
- `src/app/globals.css` — pulse-glow keyframe
