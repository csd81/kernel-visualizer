# Phase 19 — Performance Optimization

## Goal
Optimize rendering with `requestAnimationFrame` batching, `React.memo` on grid components, virtual scrolling for Gantt chart, history caps. Stable 60fps at 5000+ ticks.

## Prerequisites
- All phases complete

## Tasks

### 1. requestAnimationFrame batching

**File: `src/hooks/useSimulation.ts`**

Instead of calling `setState` every tick (which triggers a synchronous render), batch state updates and flush on `rAF`:

```ts
const pendingRef = useRef<SimState | null>(null);
const rafRef = useRef<number | null>(null);

const doTick = useCallback(() => {
  setState(prev => {
    const next = tick(prev);
    pendingRef.current = next;
    return next; // still needed for interval comparison
  });
  // Schedule a rAF flush for the UI
  if (!rafRef.current) {
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      // Force re-render with latest state
      if (pendingRef.current) {
        setState(pendingRef.current);
        pendingRef.current = null;
      }
    });
  }
}, []);
```

This is simplified — the actual approach depends on how React batches. Since React 18+ batches `setState` calls in timeouts/events, the simplest optimization is:

```ts
// Use a ref to accumulate ticks, then flush periodically
const tickAccumulator = useRef(0);
const doTick = useCallback(() => {
  tickAccumulator.current++;
  if (tickAccumulator.current >= 3 || !state.running) {
    setState(prev => tickN(prev, tickAccumulator.current));
    tickAccumulator.current = 0;
  }
}, [state.running]);
```

Where `tickN` runs N ticks at once and returns the resulting state.

### 2. React.memo on grid components

**File: `src/components/memory/FrameGrid.tsx`**

```tsx
export default React.memo(FrameGrid, (prev, next) => {
  return prev.frames === next.frames; // reference equality — only re-render if frames array changed
});
```

Apply `React.memo` to:
- `FrameGrid` — re-renders only on frame array changes
- `BlockGrid` — re-renders only on block array changes
- `ProcessTable` — re-renders only on process array changes
- `GanttChart` — re-renders only when history length changes

### 3. Virtual Gantt chart

Instead of rendering all SVG bars, only render bars in the visible viewport:
- Track scroll position
- Compute which bars are visible
- Render only those, using a spacer element for total height

Simpler alternative: limit history to last 200 entries and render all of them.

### 4. History caps

**File: `src/lib/sim.ts`**

```ts
// In tick(), after appending to history:
if (next.history.length > 500) {
  next.history = next.history.slice(-500);
}
// Same for stats arrays
Object.keys(next.stats).forEach(key => {
  if (Array.isArray(next.stats[key]) && next.stats[key].length > 100) {
    next.stats[key] = next.stats[key].slice(-100);
  }
});
```

### 5. DOM batching

Ensure all panels use the same state snapshot in a single render pass. The `SimulationContext` already provides this — all panels read from `state` in the same render cycle. No additional work needed beyond what React already handles.

### 6. Process list optimization

For large numbers of processes (100+), skip rendering process cards for TERMINATED processes after they've been cleaned up. The cleanup pass in `tick()` removes them after 3 ticks anyway.

### 7. Dev performance monitoring

Add a small FPS counter in development mode:

```tsx
const FpsCounter = () => {
  const [fps, setFps] = useState(0);
  const frames = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let raf: number;
    const tick = () => {
      frames.current++;
      const now = performance.now();
      if (now - lastTime.current >= 1000) {
        setFps(frames.current);
        frames.current = 0;
        lastTime.current = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <span className="text-[10px] font-mono text-text-muted">{fps} FPS</span>;
};
```

### 8. Immutable state caution

The current architecture spreads state objects (`{ ...state }`), which creates new references every tick. This is fine for React's reconciliation as long as `React.memo` checks use reference equality.

## Acceptance Criteria
- [ ] 60fps sustained at tick speed of 50ms for 5000+ ticks
- [ ] Grid components don't re-render when only unrelated state changes
- [ ] History is capped at 500 entries, stats arrays at 100
- [ ] FPS counter shows consistent frame rate
- [ ] No layout thrashing warnings in DevTools
- [ ] Memory usage stays stable over long runs

## Files Touched
- `src/hooks/useSimulation.ts` — optional tick batching
- `src/components/memory/FrameGrid.tsx` — React.memo
- `src/components/filesystem/BlockGrid.tsx` — React.memo
- `src/components/scheduler/ProcessTable.tsx` — React.memo
- `src/components/scheduler/GanttChart.tsx` — React.memo
- `src/lib/sim.ts` — history cap
- `src/components/dashboard/DashboardGrid.tsx` — FPS counter
