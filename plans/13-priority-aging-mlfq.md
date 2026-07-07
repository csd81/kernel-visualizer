# Phase 13 — Priority Aging & Multi-Level Feedback Queue

## Goal
Implement priority aging (boost starved processes) and MLFQ (three queue bands with demotion/promotion). Configurable parameters, visible queue lanes.

## Prerequisites
- Phase 4 (scheduling algorithms)

## Tasks

### 1. Priority aging
**Status: NOT DONE**

`applyAging()` does not exist anywhere in the codebase. `agingThreshold` is defined in `SimState` (default 20) but never read or used. Add:

**File: `src/lib/scheduler.ts`**

```ts
export function applyAging(processes: Process[], threshold: number): Process[] {
  return processes.map(p => {
    if (p.state !== "READY") return p;
    const waited = p.ticksSinceRun + 1;
    if (waited > threshold && p.priority < 9) {
      return { ...p, priority: p.priority + 1, ticksSinceRun: 0 };
    }
    return { ...p, ticksSinceRun: waited };
  });
}
```

Call `applyAging` inside `schedulePriority()` before picking the next process. Also wire `setAgingThreshold` through `SimulationContext` to allow the configurable input.

### 2. Multi-Level Feedback Queue
**Status: DONE** — `scheduleMlfq()` in `scheduler.ts` implements 3 queue levels with quanta [2, 5, 12], demotion on full quantum usage, and periodic boost every 50 ticks. Wired through the `schedule()` dispatcher. `mlfqLevel` field exists on the Process type. `ticksSinceBoost` is tracked in SimState.

### 3. MLFQ visual — three distinct queue lanes
**Status: NOT DONE**

`SchedulerPanel.tsx` currently renders all READY processes in a single lane regardless of algorithm. In MLFQ mode, split into three lanes (Q0 / Q1 / Q2) with distinct visual styles:

```tsx
{state.scheduler === "mlfq" && (
  <>
    <QueueLane label="Q0 (high)" processes={ready.filter(p => p.mlfqLevel === 0)} variant="queue" />
    <QueueLane label="Q1 (med)"  processes={ready.filter(p => p.mlfqLevel === 1)} variant="queue" />
    <QueueLane label="Q2 (low)"  processes={ready.filter(p => p.mlfqLevel === 2)} variant="queue" />
  </>
)}
{state.scheduler !== "mlfq" && (
  <QueueLane label="READY" processes={ready} />
)}
```

Apply distinct accent borders to each lane level (bright for Q0, normal for Q1, dimmed for Q2).

### 4. Periodic boost
**Status: DONE** — Built into `scheduleMlfq`. After 50 ticks, all non-terminated processes are reset to `mlfqLevel: 0` and `ticksSinceBoost` resets.

### 5. Algorithm selector update
**Status: DONE** — `AlgorithmSelector.tsx` already includes `MLFQ` in the dropdown.

### 6. Starvation indicator
**Status: NOT DONE**

Add a yellow warning badge in `SchedulerPanel` when any process has `ticksSinceRun > 30`:

```tsx
{state.processes.some(p => p.state === "READY" && p.ticksSinceRun > 30) && (
  <div className="text-[10px] text-yellow-400 flex items-center gap-1 mt-1">
    ⚠ Starvation: {state.processes.filter(p => p.state === "READY" && p.ticksSinceRun > 30).length} process(es) waiting &gt;30 ticks
  </div>
)}
```

### 7. Aging controls in UI
**Status: NOT DONE**

Add aging threshold input alongside the algorithm selector, visible for all algorithms:

**File: `src/components/scheduler/AlgorithmSelector.tsx`** (or within `SchedulerPanel`)

```tsx
{state.scheduler === "priority" && (
  <label className="flex items-center gap-1 text-[10px] text-text-secondary">
    Aging
    <input type="number" min={5} max={100}
      value={state.agingThreshold}
      onChange={e => setAgingThreshold(Number(e.target.value))}
      className="w-10 bg-white/6 border border-white/10 rounded px-1 py-0.5 text-[10px] font-mono text-text-primary"
    />
    ticks
  </label>
)}
```

## Acceptance Criteria
- [ ] Priority aging: READY process waiting > threshold ticks gets priority boost, visible on the card
- [x] MLFQ: processes start in Q0, demote after full quantum usage
- [x] MLFQ: periodic boost resets all processes to Q0 every 50 ticks
- [ ] Three distinct queue lanes visible in MLFQ mode (Q0 / Q1 / Q2)
- [ ] Starvation warning appears when a process hasn't run in 30+ ticks
- [ ] Aging threshold is configurable in the UI

## Files Touched
- `src/lib/scheduler.ts` — add `applyAging`, integrate into `schedulePriority`
- `src/types/sim.ts` — `agingThreshold` (field exists, unused ✅), `ticksSinceBoost` ✅
- `src/types/process.ts` — `ticksSinceRun` ✅, `mlfqLevel` ✅
- `src/components/scheduler/AlgorithmSelector.tsx` — add aging controls
- `src/components/panels/SchedulerPanel.tsx` — three MLFQ lanes, starvation badge
- `src/hooks/useSimulation.ts` — add `setAgingThreshold`
- `src/hooks/SimulationContext.tsx` — add `setAgingThreshold`
