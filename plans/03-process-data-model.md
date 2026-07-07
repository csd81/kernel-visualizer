# Phase 3 — Process Data Model

## Goal
Define the `Process` class, process lifecycle states, the process table, and a `ps` command that lists processes.

## Tasks

### 1. Process class
```js
class Process {
  constructor(pid, totalTicks, priority = 0) {
    this.pid = pid;
    this.state = 'READY';   // READY | RUNNING | BLOCKED | TERMINATED
    this.totalTicks = totalTicks;
    this.remainingTicks = totalTicks;
    this.priority = priority;
    this.arrivalTime = sim.tick;
    this.totalRunTicks = 0;
    this.color = processColor(pid); // deterministic color from pid
  }
}
```

### 2. Process color helper
- `processColor(pid)`: returns a color from a preset palette of 8–10 distinct hues using `pid % palette.length`

### 3. Process table
- Add to sim state: `sim.processes = []`, `sim.nextPid = 1`
- Max PID: 1024
- Helper functions:
  - `getProcess(pid)` → Process | null
  - `addProcess(proc)` → pushes, returns pid
  - `removeProcess(pid)` → splices, frees pid

### 4. `ps` command stub
- `ps()` function that builds a string table:
  ```
  PID  STATE      TICKS  PRI  ARRIVAL
  1    READY      10/10  2    0
  2    RUNNING    5/8     1    3
  ```
- For now, log to console via `window.__debug.ps = ps`

### 5. Seed demo processes
- On page load, create 3 demo processes with varying ticks/priorities so the process table is non-empty

### 6. Visual: Process Table in scheduler panel
- In `#panel-scheduler .panel-content`, render a `<table class="process-table">`
- Columns: PID, State (colored badge), Remaining Ticks, Priority, Color swatch
- `updateSchedulerPanel()` re-renders the table from `sim.processes`
- Call it from `updateUI()`

### 7. Verify
- Open page → scheduler panel shows 3 demo processes in a table
- Each process has a colored swatch, distinct states, correct tick counts
- `ps()` in console prints formatted table
- Ticking increments . . . (state doesn't change yet — that's Phase 4)
