# Phase 8 — CPU Timeline / Gantt Chart

## Goal
Render a horizontal Gantt chart showing CPU execution history. Each process gets a coloured bar per run interval. Hover shows pid + duration.

## Tasks

### 1. Context switch log
- Maintain `sim.history = []`
- On each state change READY → RUNNING (or on preempt), push:
  ```js
  { tick: sim.tick, pid: process.pid, duration: 0 } // start
  ```
- On preempt/completion, update the last entry's `duration`:
  ```js
  history[history.length - 1].duration = sim.tick - history[history.length - 1].tick;
  ```

### 2. Gantt SVG rendering
- In scheduler panel, below the queue lanes, add a `<div id="gantt-chart">`
- Render SVG with:
  - X-axis: time (ticks), each tick = a fixed pixel width (e.g. 6px)
  - Y-axis: process rows (one per PID that has run)
  - Each bar: `<rect>` with process color, `x = startTick * tickWidth`, `width = duration * tickWidth`, `y = rowIndex * rowHeight`
  - Row labels on the left: PID + process name

### 3. Auto-scroll
- When a new bar is added at the right edge, auto-scroll the SVG container horizontally (`scrollLeft = scrollWidth`)
- The Gantt container has `overflow-x: auto`

### 4. Hover tooltip
- Add `<title>` element inside each `<rect>`: `"PID ${pid} — ${duration} ticks"`
- Or use a custom tooltip `<div>` that follows the mouse and shows pid, start tick, duration

### 5. Row deduplication
- Each unique PID gets its own horizontal row
- If a process runs multiple times, bars appear on the same row with gaps between them

### 6. CPU utilization bar
- Below the Gantt, a small stat: `"CPU Util: 67%"` — computed as (ticks where at least one process was RUNNING) / total ticks
- Update every tick

### 7. Verify
- Run simulation with several processes
- Gantt chart shows coloured bars per PID, correctly placed on the time axis
- Hover shows pid + duration
- CPU utilization updates each tick
- Scroll follows the latest bar automatically
