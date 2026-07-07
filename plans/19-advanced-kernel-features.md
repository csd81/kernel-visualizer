# Phase 19 — Advanced Kernel Features

## Goal
Implement priority aging, multi-level feedback queue (MLFQ), external fragmentation visualisation on disk, and deadlock detection.

## Tasks

### 1. Priority aging
- Each tick a READY process hasn't run, increment a counter
- Every 10 ticks, if a READY process has waited > 20 ticks → boost its priority by 1 (max 9)
- Show aging boost as `+` badge on the process card: `"PRI 3 → 5 (aged)"`
- Log: `"PID 3 priority aged from 3 → 5"`
- Configurable aging threshold via `sim.agingThreshold = 20`

### 2. Multi-Level Feedback Queue (MLFQ)
- New algorithm option: `MLFQ`
- 3 priority bands:
  - **Q0** (high, quantum 2): interactive processes
  - **Q1** (medium, quantum 5): short CPU bursts
  - **Q2** (low, quantum 12): long CPU-bound processes
- Rules:
  1. Always run highest non-empty queue
  2. Process starts in Q0
  3. If it uses its full quantum → demote one level
  4. If it blocks (I/O or voluntary) → stay or promote one level
  5. Periodically boost all processes to Q0 (every 50 ticks)
- Visual: three stacked queue lanes labelled Q0/Q1/Q2 with different border colours

### 3. External fragmentation visualisation (disk)
- Add a second fragmentation metric in the filesystem panel: external fragmentation
- Visual map: show contiguous free regions as a small horizontal bar
  - `[▓▓░░▓▓▓▓░░░░░▓▓▓]` — filled blocks as dark, free as light
- Update on every alloc/free

### 4. Deadlock detection
- Track resource holds: each process has `holds: []` (frames it owns) and `waitsFor: []` (resources it's trying to allocate)
- On each tick, run a cycle-detection pass:
  ```js
  function detectDeadlock() {
    // Build wait-for graph: process → process it's blocked by
    // Use DFS to find cycles
    // Return list of deadlocked PIDs
  }
  ```
- If deadlock detected:
  - Highlight involved processes with red glow
  - Show alert in UI: `"⚠️ DEADLOCK DETECTED: PIDs [2, 5]"`
  - Suggest `kill` to resolve
  - Log to terminal

### 5. Deadlock demo scenario
- Add a `deadlock-demo` preset that sets up two processes each holding a frame and waiting on each other's
- Load via `load-preset deadlock` command
- (Stretch) auto-resolution: kill the youngest deadlocked process

### 6. Verify
- Run a long simulation → low-priority processes get aged up
- Switch to MLFQ → processes demote after using full quantum, periodic boost resets them
- Disk fragmentation visualisation updates in real time
- Induce deadlock → detection triggers red glow + alert
- `deadlock-demo` sets up a cycle on command
