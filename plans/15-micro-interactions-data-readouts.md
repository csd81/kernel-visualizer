# Phase 15 — Micro-Interactions & Data Readouts

## Goal
Add live sparklines for CPU utilization, memory pressure, disk usage. Micro-interactions (hover, tooltips) on every interactive element. Compact stat tiles per panel.

## Prerequisites
- Phase 14 (glassmorphic design)

## Tasks

### 1. Sparkline SVG component
**Status: DONE** — `Sparkline.tsx` at `src/components/shared/Sparkline.tsx`. Renders an SVG path from a data array with configurable color, width, height, and fill. Defaults to 60×20px, caps at last 100 points, handles empty state.

### 2. Track stats arrays
**Status: DONE** — `SimStats` in `types/sim.ts` has `cpuUtil: number[]`, `memoryPressure: number[]`, `diskUsage: number[]`. Pushed every tick in `doTick` in `useSimulation.ts`, sliced to last 99 values.

### 3. Stat tile component
**Status: DONE** — `StatTile.tsx` at `src/components/shared/StatTile.tsx`. Accepts label, value, optional sparkline, color-coded warning/critical thresholds. Responsive sizing.

### 4. Stat bars per panel
**Status: DONE**

- **SchedulerPanel**: CPU utilization (with cyan sparkline), context switches, tick counter
- **MemoryPanel**: Used/total frames (with magenta sparkline), fragmentation %, page fault count
- **FilesystemPanel**: Used/total blocks (with amber sparkline), fragmentation %, file count

### 5. Hover micro-interactions
**Status: DONE**

- **Process cards**: `hover:scale-105` with `title` attribute for full detail tooltip
- **Memory frames**: `hover:brightness-150 hover:scale-110` with frame number tooltip
- **Disk blocks**: `hover:brightness-150` + ring highlight on file hover, with block type tooltip
- **Gantt bars**: `fillOpacity={0.7}` with SVG `<title>` tooltip (PID, duration, tick range)
- **Buttons/selects**: `hover:bg-white/10` or `hover:brightness-150` via Tailwind

### 6. Color-coded thresholds
**Status: DONE** — `StatTile` applies `text-yellow-400` for `warn` and `text-red-400` for `critical`. Thresholds:
- CPU: warn > 80, crit > 95 (SchedulerPanel)
- Memory: warn > 80, crit > 95 (MemoryPanel via `memPct`)
- Disk: warn > 75, crit > 90 (FilesystemPanel via `diskPct`)
- Fragmentation: warn > 50, crit > 75 (both MemoryPanel and FilesystemPanel)

## Acceptance Criteria
- [x] Sparklines animate smoothly as ticks progress
- [x] Stat tiles update every tick with current values
- [x] CPU/memory/disk sparklines in their respective panels
- [x] Hover on any interactive element shows visual feedback
- [x] Thresholds change text color (yellow → red) at warning/critical levels
- [x] No performance degradation after 1000+ ticks (sparklines capped at 99–100 points)

## Files Touched
- `src/components/shared/Sparkline.tsx` — new ✅
- `src/components/shared/StatTile.tsx` — new ✅
- `src/types/sim.ts` — extended SimStats ✅
- `src/hooks/useSimulation.ts` — push stats arrays each tick ✅
- `src/components/panels/SchedulerPanel.tsx` — stat tile row ✅
- `src/components/panels/MemoryPanel.tsx` — stat tile row ✅
- `src/components/panels/FilesystemPanel.tsx` — stat tile row ✅
- `src/components/scheduler/ProcessCard.tsx` — hover tooltip ✅
- `src/components/memory/FrameGrid.tsx` — hover scale ✅
- `src/components/filesystem/BlockGrid.tsx` — hover brighten ✅
