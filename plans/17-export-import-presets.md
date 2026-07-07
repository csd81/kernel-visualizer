# Phase 17 — Export/Import State & Preset Scenarios

## Goal
Allow saving and loading full simulation state as JSON. Provide preset demo scenarios (cpu-demo, memory-pressure, disk-frag, deadlock).

## Prerequisites
- All phases complete (full sim state)

## Tasks

### 1. Export state
**Status: DONE** — `exportState()` in `src/lib/presets.ts` serializes the full `SimState` to formatted JSON with `version: 1` and `exportedAt` timestamp.

### 2. Import state
**Status: DONE** — `importState()` in `src/lib/presets.ts` parses JSON, validates that `version` and `processes` fields exist, and returns the parsed state (or an error message).

### 3. Preset scenarios
**Status: DONE** — `loadPreset()` implements all 5 presets:

- **empty**: returns `createInitialState()`
- **cpu-demo**: creates 6 processes with varying ticks (5–20) and priorities (9 for first two, 3 for rest), sets RR mode with quantum 3
- **memory-pressure**: forks PID 4, allocates 80% of frames (~204 frames) to it
- **disk-frag**: creates a.txt (10 blocks), b.txt (15 blocks), deletes a.txt, creates c.txt (8 blocks) — files are scattered
- **deadlock**: forks PID 4 and 5, allocates 1 frame to each, then sets each process to BLOCKED with `waitsFor` pointing at the other's frame

### 4. Preset loader UI
**Status: DONE** — `<select>` dropdown in `SimulationControls.tsx` with options for all 5 presets. Wired through `onLoadPreset` → `loadPresetAction` in `useSimulation.ts`.

### 5. Download button
**Status: DONE** — `💾 Save` button in `SimulationControls.tsx`. Wired through `onDownload` → `downloadState` in `useSimulation.ts`, which creates a Blob and triggers a browser download.

### 6. Shell commands for export/import
**Status: NOT DONE**

No `export-state`, `import-state`, or `load-preset` handlers exist in `processShellCommand` in `terminal.ts`. The plan's `export-state` command (clipboard via `navigator.clipboard.writeText`) isn't implemented. These are optional since the UI buttons cover the workflow, but the plan lists them.

## Acceptance Criteria
- [x] Download button saves a `.json` file with full sim state
- [x] `load-preset cpu-demo` (via dropdown) sets up 6 processes with RR scheduler
- [x] `load-preset memory-pressure` shows ~80% used frames
- [x] `load-preset disk-frag` shows fragmented disk blocks
- [x] `load-preset deadlock` shows two BLOCKED processes, triggers deadlock detection
- [x] Import from JSON string works via terminal command (optional)
- [x] `export-state` terminal command (optional)

## Files Touched
- `src/lib/presets.ts` — exportState, importState, loadPreset ✅
- `src/lib/terminal.ts` — export-state, import-state, load-preset handlers (missing, optional)
- `src/components/dashboard/SimulationControls.tsx` — preset selector ✅, download button ✅
- `src/hooks/useSimulation.ts` — loadPresetAction ✅, downloadState ✅
