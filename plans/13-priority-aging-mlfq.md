# Phase 13 — Priority Aging & Multi-Level Feedback Queue

## Goal
Implement priority aging (boost starved processes) and MLFQ (three queue bands with demotion/promotion). Configurable parameters, visible queue lanes.

## Prerequisites
- Phase 4 (scheduling algorithms)

## Tasks

### 1. Priority aging

**File: `src/lib/scheduler.ts`**

Add aging to the priority scheduler:

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

Configurable via `sim.agingThreshold` (default 20 ticks). Add toggle in the scheduler panel:
```tsx
<label className="flex items-center gap-1.5 text-[10px] text-text-secondary">
  Aging
  <input type="number" min={5} max={100} value={state.agingThreshold}
    onChange={e => setAgingThreshold(Number(e.target.value))}
    className="w-12 bg-white/6 border border-white/10 rounded px-1.5 py-0.5 text-xs font-mono" />
  ticks
</label>
```

### 2. Multi-Level Feedback Queue

**File: `src/lib/scheduler.ts`**

Add scheduling algorithm `"mlfq"`:

- 3 queues: Q0 (quantum 2, highest priority), Q1 (quantum 5), Q2 (quantum 12)
- Processes start in Q0
- If a process uses its full quantum → demote one level
- If it blocks (I/O voluntarily via `pfault`) → same or promote one level
- Periodic boost: every 50 ticks, move all processes back to Q0

```ts
const MLFQ_QUEUES = [2, 5, 12]; // quanta per level

export function scheduleMlfq(state: SimState): SimState {
  // … implementation
  // Find highest non-empty queue (0 → 1 → 2)
  // Run process from that queue
  // Track currentQuantum — if exceeded, demote
}
```

### 3. MLFQ visual

Three stacked queue lanes with distinct styles:

- **Q0** (high): bright border, `border-color: var(--color-accent-scheduler)`
- **Q1** (medium): normal border
- **Q2** (low): dimmed border, smaller cards

Update `SchedulerPanel` to render three lanes when in MLFQ mode.

### 4. Periodic boost

Track `sim.ticksSinceBoost`. After 50 ticks, move all processes to Q0 and reset counter.

```ts
if (state.scheduler === "mlfq" && state.ticksSinceBoost >= 50) {
  processes = processes.map(p => ({ ...p, mlfqLevel: 0 }));
  ticksSinceBoost = 0;
}
```

### 5. Algorithm selector update

Add `"MLFQ"` option to the `<select>` dropdown.

### 6. Starvation indicator

When any process has `ticksSinceRun > 30`, show a small yellow warning in the scheduler panel.

## Acceptance Criteria
- [ ] Priority aging: READY process waiting > 20 ticks gets priority boost, visible on the card
- [ ] MLFQ: processes start in Q0, demote after full quantum usage
- [ ] MLFQ: periodic boost resets all processes to Q0 every 50 ticks
- [ ] Three distinct queue lanes visible in MLFQ mode
- [ ] Starvation warning appears when a process hasn't run in 30+ ticks

## Files Touched
- `src/lib/scheduler.ts` — applyAging, scheduleMlfq
- `src/types/sim.ts` — agingThreshold, mlfqLevel, ticksSinceBoost
- `src/types/process.ts` — ticksSinceRun, mlfqLevel
- `src/components/scheduler/AlgorithmSelector.tsx` — add MLFQ, aging controls
- `src/components/panels/SchedulerPanel.tsx` — three lanes for MLFQ, starvation badge
