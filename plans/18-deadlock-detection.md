# Phase 18 — Deadlock Detection

## Goal
Implement wait-for graph cycle detection. Visual deadlock alerts. Auto-highlight deadlocked processes. Configurable deadlock demo scenario.

## Prerequisites
- Phase 12 (cross-subsystem integration — resource tracking)

## Tasks

### 1. Resource hold/wait tracking

**File: `src/types/process.ts`**

```ts
export interface Process {
  // ...
  holds: number[];      // frame numbers this process holds
  waitsFor: number;     // PID this process is blocked waiting for (-1 = none)
}
```

When `freeMem(pid)` is called, the freed frames may satisfy a blocked process. Track this by updating `waitsFor` on blocked processes.

### 2. Deadlock detection algorithm

**File: `src/lib/deadlock.ts`**

```ts
import type { Process } from "@/types/process";

export function detectDeadlock(processes: Process[]): number[] {
  // Build adjacency: process → process it's waiting for
  const graph = new Map<number, number>();
  for (const p of processes) {
    if (p.waitsFor !== -1) {
      graph.set(p.pid, p.waitsFor);
    }
  }

  // DFS cycle detection
  const visited = new Set<number>();
  const inStack = new Set<number>();
  const deadlocked: Set<number> = new Set();

  function dfs(pid: number): boolean {
    if (inStack.has(pid)) return true;
    if (visited.has(pid)) return false;
    visited.add(pid);
    inStack.add(pid);

    const next = graph.get(pid);
    if (next !== undefined && dfs(next)) {
      deadlocked.add(pid);
      deadlocked.add(next);
      return true;
    }

    inStack.delete(pid);
    return false;
  }

  for (const pid of graph.keys()) {
    if (!visited.has(pid)) dfs(pid);
  }

  return [...deadlocked];
}
```

### 3. Integration into tick

**File: `src/lib/sim.ts`**

After scheduling, run deadlock detection:

```ts
const deadlocked = detectDeadlock(next.processes);
next = { ...next, deadlockedPids: deadlocked };

if (deadlocked.length > 0 && !state.deadlockedPids?.length) {
  // Just detected — add alert to terminal
  const msg = `⚠️ DEADLOCK DETECTED: PIDs [${deadlocked.join(", ")}]`;
  const output = addLine(next.terminal.output, msg, "warning");
  next = { ...next, terminal: { ...next.terminal, output } };
}
```

### 4. Deadlock visual alert

- Add `deadlockedPids: number[]` to `SimState`
- In `SchedulerPanel`, highlight deadlocked process cards with a red glow:

```tsx
className={`rounded-lg ... ${state.deadlockedPids?.includes(process.pid) ? "ring-2 ring-red-500 animate-pulse" : ""}`}
```

- In `DashboardGrid.tsx`, show a persistent deadlock banner:

```tsx
{state.deadlockedPids && state.deadlockedPids.length > 0 && (
  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-sm text-red-400 flex items-center justify-between">
    <span>⚠️ Deadlock detected: PIDs [{state.deadlockedPids.join(", ")}]</span>
    <span className="text-[10px] text-text-muted">Use `kill &lt;pid&gt;` to resolve</span>
  </div>
)}
```

### 5. Deadlock preset

Update `loadPreset("deadlock")` in `presets.ts` to actually set up a cycle:

```ts
case "deadlock": {
  let s = createInitialState();
  // Fork 2 processes
  s = fork(s, 30, 5).state;
  s = fork(s, 30, 5).state;
  // Allocate 1 frame to each
  const r1 = allocateFrames(s.memory, 1, 1);
  if (!r1.message) s = { ...s, memory: r1.memory };
  const r2 = allocateFrames(s.memory, 2, 1);
  if (!r2.message) s = { ...s, memory: r2.memory };
  // Set up wait: P1 waits for P2's frame, P2 waits for P1's frame
  s.processes = s.processes.map(p => {
    if (p.pid === 1) return { ...p, state: "BLOCKED" as const, waitsFor: 2, holds: [r1.allocated[0]] };
    if (p.pid === 2) return { ...p, state: "BLOCKED" as const, waitsFor: 1, holds: [r2.allocated[0]] };
    return p;
  });
  return { ...s, running: true };
}
```

### 6. Kill resolves deadlock

When a deadlocked process is killed, its frames are freed, which may unblock the other process. The next tick's `retryBlockedProcesses` picks this up naturally.

## Acceptance Criteria
- [ ] Deadlock detection finds cycles in the wait-for graph
- [ ] Deadlocked processes glow red in the scheduler panel
- [ ] Deadlock banner appears at the top of the dashboard
- [ ] `load-preset deadlock` sets up a verifiable deadlock
- [ ] Killing one deadlocked process resolves the other

## Files Touched
- `src/lib/deadlock.ts` — detectDeadlock
- `src/lib/sim.ts` — run detection each tick
- `src/types/sim.ts` — deadlockedPids
- `src/components/dashboard/DashboardGrid.tsx` — deadlock banner
- `src/components/scheduler/ProcessCard.tsx` — deadlock glow
- `src/lib/presets.ts` — deadlock preset
