# Phase 20 — Final Polish & Edge Cases

## Goal
Keyboard shortcuts, responsive layout, export/import state, preset scenarios, performance tuning, and edge-case bug sweep.

## Tasks

### 1. Keyboard shortcuts
- `Space` (on document, not in terminal input): toggle pause/resume
- `+` / `=`: increase speed
- `-`: decrease speed
- `R` (with no terminal focus): reset simulation (with confirmation)
- Show a small hint bar: `"SPACE: pause  +/-: speed"`
- Prevent shortcuts when terminal `<input>` is focused

### 2. Responsive layout deep pass
- Test at 1280px, 1024px, 768px, 480px
- At < 768px: panels stack vertically, font sizes reduce, grids shrink (memory 16×16 → 8×8? or keep and add horizontal scroll)
- Touch-friendly: larger click targets for frames/blocks (min 20px)
- Terminal always has a minimum visible height

### 3. Export / Import state
- `export-state` command:
  - Serialises `sim` (processes, memory, disk, history) to JSON
  - Downloads as `kernel-state.json`
- `import-state` command:
  - Accepts JSON string (paste) or file input
  - Full state restore (processes, memory, disk, tick count)
  - Validation: check version compatibility
- (Alternative) Use `navigator.clipboard` for copy/paste

### 4. Preset scenarios
- `load-preset <name>` command:
  - `empty`: clean slate
  - `cpu-demo`: 6 processes with varying ticks, switch to RR
  - `memory-pressure`: allocate 80% of memory, show fragmentation
  - `disk-frag`: create/delete files to fragment the disk
  - `deadlock`: two-process deadlock cycle (from Phase 19)
- Each preset sets sim state programmatically

### 5. Performance optimisation
- Cap DOM updates to `requestAnimationFrame`:
  - Collect all state changes during a tick
  - Apply DOM updates in the next `rAF` callback
- Batch DOM reads/writes (avoid layout thrashing)
- Virtual scroll for Gantt chart (only render visible bars)
- Limit history arrays: `sim.history` max 500 entries, trim oldest
- Sparklines cap at 100 data points
- Check memory usage after 5000 ticks

### 6. Edge-case sweep
- Fork with no PIDs available (overflow past 1024) → graceful error
- Alloc with negative size → clamped or rejected
- Kill already-terminated process → no-op with message
- Create file when all inodes used → error
- Remove non-existent file → error
- Speed set to 0 → clamp to min 50
- Pause while already paused → no-op
- Empty command → no-op
- Very long terminal lines → wrap or truncate
- All memory allocated → all further allocs fail with clear message
- All disk blocks used → create fails with "disk full"
- Both memory AND disk full → error shows which resource is exhausted

### 7. App reset
- `reset-sim` command: confirm, then full state reset
- Clears processes, memory, disk, history, tick counter
- Re-initialises to clean state (equivalent to page reload)

### 8. Final visual polish
- Consistent spacing pass on all panels
- Transitions on all state changes (no abrupt jumps)
- Loading state: initial state shows welcome message in terminal
- Favicon (simple SVG icon — "K" or a chip silhouette)

### 9. Verify
- Keyboard shortcuts work globally (except in terminal input)
- `export-state` produces valid JSON, `import-state` restores it
- `load-preset memory-pressure` creates expected state
- 5000 ticks with no performance degradation
- Every edge case returns a user-friendly error message, not a crash
- `reset-sim` returns to clean state
- Layout works at 480px width (stacked, scrollable)
