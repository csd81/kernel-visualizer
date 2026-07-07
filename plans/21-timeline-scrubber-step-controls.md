# Phase 21 — Timeline Scrubber & Step Controls

## Goal
Add manual step control (single tick forward/backward) and a timeline scrubber that lets you click anywhere on the Gantt chart to reconstruct and inspect system state at that point in history.

## Prerequisites
- All prior phases (full sim state, history tracking, Gantt chart)

## Tasks

### 1. View tick state

**File: `src/types/sim.ts`**

Add a `viewTick` field to `SimState` to track which tick the user is currently inspecting:

```ts
export interface SimState {
  // ... existing fields
  viewTick: number;        // tick being viewed (-1 = live, following real ticks)
}
```

When `viewTick === -1`, the UI follows the live simulation as it does today. When `viewTick >= 0`, all panels render the reconstructed state at that tick and the simulation pauses.

Set initial value in `createInitialState()`:
```ts
viewTick: -1,
```

### 2. State reconstruction from history

**File: `src/lib/sim.ts`**

Add a function that replays history from an initial state up to a target tick:

```ts
import type { SimState } from "@/types/sim";

/** Reconstruct the SimState as it appeared at a given tick by replaying history. */
export function reconstructStateAt(
  initialState: SimState,
  history: HistoryEntry[],
  targetTick: number
): SimState {
  if (targetTick < 0) return initialState;

  // Start from a clean base and replay each tick's transitions
  let state = initialState;

  // Collect all events up to targetTick
  const events = history.filter(h => h.tick <= targetTick);

  for (let tick = 0; tick <= targetTick; tick++) {
    const tickEvents = events.filter(h => h.tick === tick);

    // Advance tick
    state = { ...state, tick };

    for (const event of tickEvents) {
      switch (event.event) {
        case "scheduled": {
          state = {
            ...state,
            processes: state.processes.map(p =>
              p.pid === event.pid
                ? { ...p, state: "RUNNING" as const, currentQuantumTicks: 0 }
                : p.state === "RUNNING"
                  ? { ...p, state: "READY" as const }
                  : p
            ),
            stats: { ...state.stats, contextSwitches: state.stats.contextSwitches + 1 },
          };
          break;
        }
        case "terminated": {
          state = {
            ...state,
            processes: state.processes.map(p =>
              p.pid === event.pid
                ? { ...p, state: "TERMINATED" as const, terminatedTick: tick }
                : p
          )};
          break;
        }
        case "preempted": {
          state = {
            ...state,
            processes: state.processes.map(p =>
              p.pid === event.pid
                ? { ...p, state: "READY" as const, readyTick: tick, currentQuantumTicks: 0 }
                : p
          )};
          break;
        }
        case "blocked": {
          state = {
            ...state,
            processes: state.processes.map(p =>
              p.pid === event.pid
                ? { ...p, state: "BLOCKED" as const, blockedTick: tick }
                : p
          )};
          break;
        }
      }
    }
  }

  return state;
}
```

Optimization: cache reconstructed states by tick in a Map to avoid re-replaying from tick 0 on every scrub interaction.

### 3. Step controls

**File: `src/components/dashboard/SimulationControls.tsx`**

Add step forward/backward buttons between the Play/Pause and Speed controls:

```tsx
<button
  onClick={() => setViewTick(state.tick - 1)}
  disabled={state.viewTick <= 0}
  className="px-2 py-1.5 text-xs rounded-lg bg-white/6 border border-white/10 hover:bg-white/10 transition-colors font-mono disabled:opacity-30 disabled:cursor-not-allowed"
  title="Step backward"
>
  ⏪
</button>

<button
  onClick={onStepForward}
  className="px-2 py-1.5 text-xs rounded-lg bg-white/6 border border-white/10 hover:bg-white/10 transition-colors font-mono"
  title="Step forward one tick"
>
  ⏩
</button>
```

`onStepForward` advances one tick without running the simulation loop (calls `doTick` once without the interval).

### 4. Timeline scrubber

**File: `src/components/scheduler/GanttChart.tsx`**

Add a scrubber overlay to the Gantt chart:

```tsx
interface Props {
  history: HistoryEntry[];
  tickWidth?: number;
  rowHeight?: number;
  viewTick?: number;       // current scrub position (-1 = live)
  onScrub?: (tick: number) => void;
}
```

On click/drag over the SVG, compute the tick from the x-coordinate and call `onScrub`. Render a vertical line at the scrubbed position:

```tsx
{viewTick >= 0 && (
  <line
    x1={viewTick * tickWidth + 35}
    y1={0}
    x2={viewTick * tickWidth + 35}
    y2={pids.length * rowHeight + 20}
    stroke="#fff"
    strokeWidth={1}
    strokeOpacity={0.4}
    strokeDasharray="3 3"
  />
)}
```

Attach a `mousedown`/`mousemove` handler to the SVG for drag scrubbing:

```tsx
const handleScrub = useCallback((clientX: number) => {
  if (!scrollRef.current || !onScrub) return;
  const rect = scrollRef.current.getBoundingClientRect();
  const scrollLeft = scrollRef.current.scrollLeft;
  const x = clientX - rect.left + scrollLeft - 35;
  const tick = Math.max(0, Math.round(x / tickWidth));
  onScrub(tick);
}, [tickWidth, onScrub]);

return (
  <div ref={scrollRef} className="overflow-x-auto mt-2" onMouseDown={e => handleScrub(e.clientX)} onMouseMove={e => e.buttons === 1 && handleScrub(e.clientX)}>
    // ...svg content
  </div>
);
```

### 5. View mode indicator

Add a visual indicator in the scheduler panel header when in scrub mode:

```tsx
{state.viewTick >= 0 && (
  <span className="text-[10px] text-yellow-400 font-mono ml-2">
    📍 Viewing tick {state.viewTick} (live: {state.tick})
  </span>
)}
```

When a user scrubs, show "Viewing tick X (live: Y)" and pause the simulation. Add a "⬅ Back to Live" button to resume:

```tsx
<button
  onClick={() => setViewTick(-1)}
  className="text-[10px] text-accent-scheduler hover:underline ml-2"
>
  ⬅ Back to Live
</button>
```

### 6. Context wiring

**File: `src/hooks/SimulationContext.tsx`** — add:
```ts
setViewTick: (tick: number) => void;
stepForward: () => void;
```

**File: `src/hooks/useSimulation.ts`** — implement:

```ts
const [reconstructedState, setReconstructedState] = useState<SimState | null>(null);
const [cachedSnapshots] = useState(() => new Map<number, SimState>());
const initialStateRef = useRef(createInitialState());

const setViewTick = useCallback((tick: number) => {
  if (tick === -1) {
    setViewTick(-1);
    setReconstructedState(null);
    return;
  }

  // Check cache first
  let snapshot = cachedSnapshots.get(tick);
  if (!snapshot) {
    snapshot = reconstructStateAt(initialStateRef.current, state.history, tick);
    cachedSnapshots.set(tick, snapshot);
  }

  setViewTick(tick);
  setReconstructedState(snapshot);
}, [state.history, cachedSnapshots]);
```

Modify the context value so that when `viewTick >= 0`, consumers receive the reconstructed state instead of the live state:

```ts
const displayState = reconstructedState ?? state;
```

### 7. Play/Pause interaction with scrub

- When user scrubs or steps, pause the simulation (`running: false`) and set `viewTick`.
- When user clicks "Back to Live" or Play, clear `viewTick` to `-1` and resume.
- While scrubbing, the Gantt chart highlights the selected tick and all panels reflect state at that tick.

## Acceptance Criteria
- [ ] Step forward advances one tick without running the loop
- [ ] Step backward goes back one tick
- [ ] Clicking on the Gantt chart scrubs to that tick
- [ ] Dragging across the Gantt chart drag-scrubs through ticks
- [ ] All panels update to reflect state at the scrubbed tick
- [ ] Viewing indicator shows "Viewing tick X (live: Y)"
- [ ] "Back to Live" button exits scrub mode
- [ ] State reconstruction is cached for performance
- [ ] Simulation pauses on scrub, resumes on "Back to Live" or Play

## Files Touched
- `src/types/sim.ts` — viewTick field
- `src/lib/sim.ts` — reconstructStateAt
- `src/components/scheduler/GanttChart.tsx` — click/drag scrub, vertical line overlay
- `src/components/dashboard/SimulationControls.tsx` — step buttons
- `src/components/panels/SchedulerPanel.tsx` — view mode indicator
- `src/hooks/useSimulation.ts` — setViewTick, stepForward, state reconstruction, caching
- `src/hooks/SimulationContext.tsx` — setViewTick, stepForward, displayState
