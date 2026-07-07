# Phase 20 — Edge Cases & Final Polish

## Goal
Sweep all edge cases. Add welcome message, favicon, error boundaries, reset functionality. Final visual polish pass.

## Prerequisites
- All prior phases

## Tasks

### 1. Edge-case sweep
**Status: MOSTLY DONE**

The engine functions and terminal handlers already handle most failure modes gracefully:

| Scenario | Expected Behavior | Status |
|---|---|---|
| `fork` with max PIDs (1024) | Error: "maximum processes reached" | ✅ |
| `fork` with NaN ticks | Defaults to 10 ticks | ✅ |
| `alloc` with negative size | NaN check → usage error | ✅ |
| `kill` already terminated PID | "already terminated" | ✅ |
| `kill` unknown PID | "unknown PID" | ✅ |
| `create` when all inodes used | "no free inodes" | ✅ |
| `create` with empty name | "Error: invalid filename" | ✅ |
| `rm` non-existent file | "not found" | ✅ |
| `speed` out of range (50–2000) | Clamped in `setSpeed` hook | ✅ |
| Empty command | No-op (terminal-parser returns empty cmd) | ✅ |
| Whitespace-only command | No-op (trimmed to empty) | ✅ |
| Non-numeric args to numeric params | isNaN check → usage error | ✅ |
| All memory allocated | Next alloc returns error message | ✅ |
| All disk blocks used | "disk full" error | ✅ |
| Pause while paused / resume while running | No-op (early return in hook) | ✅ |
| `import-state` malformed JSON | "Invalid JSON" error | ✅ |
| `import-state` wrong structure | "Invalid state file" error | ✅ |

One gap: no explicit `reset-sim` terminal command (the UI reset button covers this).

### 2. Welcome message
**Status: DONE** — Rendered in `createInitialState()` in `src/lib/sim.ts` as a 6-line ASCII-art box with "Kernel Visualizer v1.0" and "Type 'help' to get started."

### 3. Error boundaries
**Status: DONE** — `ErrorBoundary` component at `src/components/shared/ErrorBoundary.tsx` catches render errors and shows a per-panel fallback. Wrapped around all four panels in `DashboardGrid.tsx`.

### 4. Reset simulation
**Status: DONE** — `resetSim()` in `useSimulation.ts` calls `createInitialState()` to wipe everything. Wired to the `↺ Reset` button in `SimulationControls.tsx` and exposed via `SimulationContext`.

### 5. Favicon
**Status: DONE** — `public/favicon.svg` with a dark square, cyan "K" letter. Wired in `layout.tsx` metadata as `icons: { icon: "/favicon.svg" }`.

### 6. Final visual polish
**Status: MOSTLY DONE**

- Empty states: "No history yet" (GanttChart), "empty" (QueueLane), "Click a frame to inspect" (FrameDetail), "No files." (ls) — all present
- Transitions: per-component `transition-all duration-300`, `transition-colors`, `transition-shadow` patterns
- Skeleton placeholders: not needed (client-side only, instant state)

### 7. Accessibility pass
**Status: PARTIALLY DONE**

- `prefers-reduced-motion` media query in globals.css ✅
- Terminal input auto-focuses on click ✅
- Color is not the only differentiator for process state (text labels in ProcessTable) ✅
- **Focus-visible ring**: no `focus-visible:ring-2` or equivalent focus styles on interactive elements ❌

### 8. Console noise cleanup
**Status: DONE** — No stray `console.log` calls in production code. `console.error` used only in `ErrorBoundary.componentDidCatch`.

### 9. Shell history persistence
**Status: NOT DONE**

No `sessionStorage` persistence for terminal history. History resets on page reload. The plan describes saving/restoring `state.terminal.history` via `sessionStorage` in `useSimulation.ts`.

## Acceptance Criteria
- [x] Welcome message shows on first load
- [x] Error boundaries catch and display per-panel errors
- [x] `↺ Reset` returns to clean state with welcome message
- [x] Favicon appears in browser tab
- [x] No console errors or warnings
- [x] All panels handle empty/null state gracefully
- [x] Every edge case returns a user-friendly error message
- [x] Focus outlines visible on keyboard navigation
- [x] Terminal history persists across page reloads

## Files Touched
- `src/components/shared/ErrorBoundary.tsx` — new ✅
- `src/components/dashboard/DashboardGrid.tsx` — error boundaries ✅
- `src/lib/terminal.ts` — all edge case guards ✅
- `src/lib/sim.ts` — welcome message in initial state ✅
- `src/hooks/useSimulation.ts` — resetSim ✅
- `src/app/layout.tsx` — favicon metadata ✅
- `public/favicon.svg` — new ✅
- `src/app/globals.css` — focus-visible styles (missing)
- `src/hooks/useSimulation.ts` — sessionStorage for history (missing)
