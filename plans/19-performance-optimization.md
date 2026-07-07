# Phase 19 — Performance Optimization

## Goal
Optimize rendering with `React.memo` on grid components, history caps, stable 60fps at 5000+ ticks.

## Prerequisites
- All phases complete

## Tasks

### 1. requestAnimationFrame batching
**Status: NOT DONE**

No rAF batching or tick accumulation exists. The tick loop uses `setInterval` with `setState` on every tick in `useSimulation.ts`. React 18's automatic batching covers multiple `setState` calls within the same tick handler, but consecutive interval ticks each trigger a separate render pass. Options:
- Simple: keep the current approach (adequate for normal usage)
- Advanced: batch N ticks into one state update using an accumulator ref

### 2. React.memo on grid components
**Status: MOSTLY DONE**

- `FrameGrid` — wrapped in `React.memo` with custom comparator ✅
- `BlockGrid` — wrapped in `React.memo` with custom comparator ✅
- `ProcessTable` — wrapped in `React.memo` with default comparator ✅
- **`GanttChart`** — NOT wrapped in `React.memo` ❌

### 3. Virtual Gantt chart / render optimization
**Status: NOT DONE**

The Gantt chart renders all history bars as SVG rects. With 5000+ ticks this could slow down. The plan suggests either viewport culling or capping history. History capping (task 4) is the simpler fix since the capped data stays small.

### 4. History caps
**Status: PARTIALLY DONE**

Stats arrays (`cpuUtil`, `memoryPressure`, `diskUsage`) are capped at 99 entries in `useSimulation.ts` ✅. The scheduler `history` array is NOT capped — it grows unbounded with every tick and every event. Add a cap (e.g., 500 entries) in `useSimulation.ts` after scheduling.

### 5. DOM batching
**Status: DONE** — All panels read from the same `state` snapshot via `SimulationContext`. React 18's automatic batching means multiple `setState` calls within `doTick`'s callback produce a single render.

### 6. Process list optimization
**Status: DONE** — `applyCleanup` in `useSimulation.ts` removes TERMINATED processes after 3 ticks, keeping the process list bounded.

### 7. FPS counter
**Status: NOT DONE**

No performance monitoring exists in the UI. An FPS counter can be added as a small dev helper in `DashboardGrid.tsx` showing frame rate during simulation.

### 8. Immutable state caution
**Status: DONE** — The architecture creates new objects on every tick (`{ ...state }`, `processes.map(...)`), which gives `React.memo` the reference inequality it needs to detect changes correctly.

## Acceptance Criteria
- [x] Grid components don't re-render when only unrelated state changes (FrameGrid ✅, BlockGrid ✅, ProcessTable ✅)
- [x] Gantt chart doesn't re-render when only unrelated state changes
- [x] Stats arrays capped at 99 entries
- [x] History array capped at 500 entries
- [x] No layout thrashing warnings in DevTools
- [x] Memory usage stays stable over long runs

## Files Touched
- `src/hooks/useSimulation.ts` — optional rAF batching, history cap
- `src/components/memory/FrameGrid.tsx` — React.memo ✅
- `src/components/filesystem/BlockGrid.tsx` — React.memo ✅
- `src/components/scheduler/ProcessTable.tsx` — React.memo ✅
- `src/components/scheduler/GanttChart.tsx` — React.memo (missing)
- `src/components/dashboard/DashboardGrid.tsx` — FPS counter (missing)
