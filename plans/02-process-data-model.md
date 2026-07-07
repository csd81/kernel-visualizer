# Phase 2 — Process Data Model & Process Table

## Goal
Define the `Process` class, typed process states, the process table, and render a process table in the Scheduler panel.

## Prerequisites
- Phase 1 (project skeleton, tick loop, panels)

## Tasks

### 1. Process types

**File: `src/types/process.ts`**

```ts
export type ProcessState = "READY" | "RUNNING" | "BLOCKED" | "TERMINATED";

export interface Process {
  pid: number;
  state: ProcessState;
  totalTicks: number;
  remainingTicks: number;
  priority: number;
  arrivalTick: number;
  totalRunTicks: number;
  color: string;
  pageTable: PageTableEntry[];
  holds: number[];   // frame numbers held
  waitsFor: number;  // resource PID or -1
}
```

### 2. Color palette

**File: `src/lib/colors.ts`**

```ts
const PALETTE = [
  "#00e5ff", "#76ff03", "#ffea00", "#ff3d00",
  "#d500f9", "#ff9100", "#00e676", "#ea80fc",
  "#18ffff", "#ff6e40",
];

export function processColor(pid: number): string {
  return PALETTE[pid % PALETTE.length];
}
```

### 3. Scheduler engine stub

**File: `src/lib/scheduler.ts`**

```ts
import type { Process } from "@/types/process";

let nextPid = 1;
const MAX_PID = 1024;

export function getNextPid(): number {
  const pid = nextPid;
  nextPid = (nextPid % MAX_PID) + 1;
  return pid;
}

export function createProcess(ticks: number, priority: number): Process {
  return {
    pid: getNextPid(),
    state: "READY",
    totalTicks: ticks,
    remainingTicks: ticks,
    priority: Math.max(0, Math.min(9, priority)),
    arrivalTick: 0,  // set by caller
    totalRunTicks: 0,
    color: processColor(nextPid - 1),
    pageTable: [],
    holds: [],
    waitsFor: -1,
  };
}
```

### 4. Add processes to sim state

**File: `src/types/sim.ts`** — import and use `Process`

Add `nextPid: number` to `SimState`:
```ts
import type { Process } from "./process";
// ...
export interface SimState {
  tick: number;
  running: boolean;
  speed: number;
  nextPid: number;
  processes: Process[];
  // ...
}
```

**File: `src/lib/sim.ts`** — update `createInitialState`:
```ts
export function createInitialState(): SimState {
  return {
    tick: 0,
    running: false,
    speed: 500,
    nextPid: 1,
    processes: [
      createInitialProcess(1, 10, 2),
      createInitialProcess(2, 8, 1),
      createInitialProcess(3, 15, 0),
    ],
    // ...
  };
}
```

Helper `createInitialProcess` seeds three demo processes so the table isn't empty on load.

### 5. Process table React component

**File: `src/components/scheduler/ProcessTable.tsx`**

Renders a compact table:

```tsx
"use client";

import type { Process } from "@/types/process";

interface Props {
  processes: Process[];
}

const STATE_COLORS: Record<string, string> = {
  READY: "text-blue-400",
  RUNNING: "text-green-400",
  BLOCKED: "text-yellow-400",
  TERMINATED: "text-red-400",
};

export default function ProcessTable({ processes }: Props) {
  return (
    <table className="w-full text-xs font-mono">
      <thead>
        <tr className="text-text-muted uppercase tracking-wider">
          <th className="text-left py-1 pr-2">PID</th>
          <th className="text-left py-1 pr-2">State</th>
          <th className="text-left py-1 pr-2">Ticks</th>
          <th className="text-left py-1 pr-2">Pri</th>
        </tr>
      </thead>
      <tbody>
        {processes.map(p => (
          <tr key={p.pid} className="border-t border-white/5">
            <td className="py-1 pr-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
              {p.pid}
            </td>
            <td className={`py-1 pr-2 ${STATE_COLORS[p.state]}`}>{p.state}</td>
            <td className="py-1 pr-2">{p.remainingTicks}/{p.totalTicks}</td>
            <td className="py-1 pr-2">{p.priority}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 6. Wire into SchedulerPanel

**File: `src/components/panels/SchedulerPanel.tsx`**

```tsx
"use client";

import { useSimulation } from "@/hooks/useSimulation";
import ProcessTable from "../scheduler/ProcessTable";

export default function SchedulerPanel() {
  const { state } = useSimulation();
  return (
    <section className="rounded-xl bg-white/3 backdrop-blur-xl border border-white/6 p-5
      [border-color:var(--color-accent-scheduler)]/30
      hover:[border-color:var(--color-accent-scheduler)]/60 transition-colors">
      <h2 className="text-xs uppercase tracking-[0.12em] text-text-muted mb-3">Scheduler</h2>
      <ProcessTable processes={state.processes} />
    </section>
  );
}
```

Now `useSimulation` is provided by a React Context so nested panels can access it. Add a context provider.

### 7. SimulationContext

**File: `src/hooks/SimulationContext.tsx`**

```tsx
"use client";

import { createContext, useContext } from "react";
import type { SimState } from "@/types/sim";

interface SimContextValue {
  state: SimState;
  start: () => void;
  stop: () => void;
  setSpeed: (ms: number) => void;
}

export const SimulationContext = createContext<SimContextValue | null>(null);

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used within SimulationProvider");
  return ctx;
}
```

**File: `src/components/dashboard/SimulationProvider.tsx`**

```tsx
"use client";

import { useSimulation as useSimulationHook } from "@/hooks/useSimulation";
import { SimulationContext } from "@/hooks/SimulationContext";

export default function SimulationProvider({ children }: { children: React.ReactNode }) {
  const sim = useSimulationHook();
  return <SimulationContext.Provider value={sim}>{children}</SimulationContext.Provider>;
}
```

Update `DashboardGrid.tsx` to wrap content in `<SimulationProvider>` and update all panels to use `useSimulation()` from context.

## Acceptance Criteria
- [x] Scheduler panel shows a table with 3 demo processes (PID 1, 2, 3)
- [x] Each row has a colored dot, state label, tick count, priority
- [x] Running the sim increments `tick:` in header but doesn't change states yet
- [x] Table is compact and readable at small font sizes

## Files Touched
- `src/types/process.ts` — Process type
- `src/lib/colors.ts` — process color palette
- `src/lib/scheduler.ts` — createProcess
- `src/types/sim.ts` — add nextPid, processes
- `src/lib/sim.ts` — seed demo processes
- `src/hooks/SimulationContext.tsx` — context + provider
- `src/components/dashboard/SimulationProvider.tsx` — provider wrapper
- `src/components/scheduler/ProcessTable.tsx` — table component
- `src/components/panels/SchedulerPanel.tsx` — wire table
- `src/components/dashboard/DashboardGrid.tsx` — use provider
