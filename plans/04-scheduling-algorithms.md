# Phase 4 — Round Robin & Priority Scheduling

## Goal
Add Round Robin (with configurable quantum) and Priority scheduling algorithms. Allow switching algorithms via a dropdown. `fork` and `kill` commands wired through the terminal.

## Prerequisites
- Phase 3 (FCFS scheduler, queue lanes)

## Tasks

### 1. Round Robin scheduler

**File: `src/lib/scheduler.ts`**

Add `scheduleRr(state: SimState): SimState`:

- Tracks `Process.currentQuantumTicks` (add to Process interface)
- On each tick, decrement `remainingTicks`, increment `currentQuantumTicks`
- If process completes → TERMINATED
- If `currentQuantumTicks >= state.quantum` → preempt: move to end of READY queue, pick next READY
- Preempted process gets `currentQuantumTicks = 0`

### 2. Priority scheduler

Add `schedulePriority(state: SimState): SimState`:

- Find the highest-priority READY process
- Non-preemptive: let it run to completion
- (Optional: add a "preemptive priority" checkbox later)

### 3. Algorithm selector

**File: `src/types/sim.ts`**

```ts
export type SchedAlgorithm = "fcfs" | "rr" | "priority";
```

Add to `SimState`:
```ts
scheduler: SchedAlgorithm;
quantum: number;
```

**File: `src/components/scheduler/AlgorithmSelector.tsx`**

```tsx
"use client";

import { useSimulation } from "@/hooks/SimulationContext";
import type { SchedAlgorithm } from "@/types/sim";

export default function AlgorithmSelector() {
  const { state, setScheduler, setQuantum } = useSimulation();

  return (
    <div className="flex items-center gap-3 mb-3">
      <select
        value={state.scheduler}
        onChange={e => setScheduler(e.target.value as SchedAlgorithm)}
        className="bg-white/6 border border-white/10 rounded px-2 py-1 text-xs font-mono text-text-primary"
      >
        <option value="fcfs">FCFS</option>
        <option value="rr">Round Robin</option>
        <option value="priority">Priority</option>
      </select>
      {state.scheduler === "rr" && (
        <label className="flex items-center gap-1.5 text-[10px] text-text-secondary">
          Quantum
          <input
            type="number"
            min={1}
            max={20}
            value={state.quantum}
            onChange={e => setQuantum(Number(e.target.value))}
            className="w-12 bg-white/6 border border-white/10 rounded px-1.5 py-0.5 text-xs font-mono text-text-primary"
          />
          ticks
        </label>
      )}
    </div>
  );
}
```

### 4. Routing ticks through the selected algorithm

**File: `src/lib/sim.ts`** — update `tick()`:

```ts
export function tick(state: SimState): SimState {
  let next = { ...state, tick: state.tick + 1 };
  switch (next.scheduler) {
    case "rr": next = scheduleRr(next); break;
    case "priority": next = schedulePriority(next); break;
    default: next = scheduleFcfs(next); break;
  }
  return next;
}
```

### 5. Fork command

**File: `src/lib/scheduler.ts` — add `fork(state, ticks, priority)`**

```ts
export function fork(state: SimState, ticks: number, priority: number): { state: SimState; message: string } {
  if (state.processes.length >= 1024) {
    return { state, message: "Error: maximum processes reached" };
  }
  const proc = createProcess(
    Math.max(1, Math.min(100, ticks)),
    Math.max(0, Math.min(9, priority))
  );
  proc.arrivalTick = state.tick;
  const processes = [...state.processes, proc];
  return {
    state: { ...state, processes },
    message: `Created PID ${proc.pid} (${ticks} ticks, pri ${priority})`,
  };
}
```

### 6. Kill command

```ts
export function kill(state: SimState, pid: number): { state: SimState; message: string } {
  const idx = state.processes.findIndex(p => p.pid === pid);
  if (idx === -1) return { state, message: `Error: unknown PID ${pid}` };
  const proc = state.processes[idx];
  if (proc.state === "TERMINATED") return { state, message: `Error: PID ${pid} already terminated` };
  const processes = state.processes.map(p => p.pid === pid ? { ...p, state: "TERMINATED" as const } : p);
  return { state: { ...state, processes }, message: `PID ${pid} terminated` };
}
```

### 7. Expose scheduler actions via SimulationContext

Add `fork()`, `kill()`, `setScheduler()`, `setQuantum()` to the context value and implement them in `useSimulation` hook:

```ts
const fork = useCallback((ticks: number, priority: number) => {
  setState(prev => {
    const result = schedulerLib.fork(prev, ticks, priority);
    return result.state;
  });
}, []);
```

### 8. Quantum countdown ring

**File: `src/components/scheduler/ProcessCard.tsx`**

When in RR mode, show an SVG ring around the running process card:

```tsx
{variant === "running" && quantum !== undefined && (
  <svg className="absolute top-1 right-1 w-6 h-6" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="16" fill="none" stroke="white/10" strokeWidth="2" />
    <circle
      cx="18" cy="18" r="16" fill="none" stroke={process.color}
      strokeWidth="2" strokeDasharray="100"
      strokeDashoffset={100 - (process.currentQuantumTicks / quantum) * 100}
      strokeLinecap="round" transform="rotate(-90 18 18)"
    />
  </svg>
)}
```

### 9. Scheduler stats

Show `"Context switches: N"` and current algorithm name in the scheduler panel header area.

## Acceptance Criteria
- [x] Dropdown switches between FCFS, RR, Priority
- [x] RR preempts after quantum expires, card moves back to READY
- [x] Priority mode picks highest-priority READY process
- [x] Quantum number input only appears in RR mode
- [x] `fork` via context creates a new process
- [x] `kill` via context terminates a process
- [x] Context switch counter increments on every switch
- [x] Quantum ring depletes visually on the running card

## Files Touched
- `src/lib/scheduler.ts` — scheduleRr, schedulePriority, fork, kill
- `src/lib/sim.ts` — tick dispatches to selected algorithm
- `src/types/sim.ts` — SchedAlgorithm, quantum, currentQuantumTicks
- `src/types/process.ts` — add currentQuantumTicks to Process
- `src/components/scheduler/AlgorithmSelector.tsx` — new
- `src/components/scheduler/ProcessCard.tsx` — quantum ring
- `src/components/panels/SchedulerPanel.tsx` — algorithm selector, stats
- `src/hooks/SimulationContext.tsx` — new action methods
- `src/hooks/useSimulation.ts` — fork, kill, setScheduler, setQuantum
