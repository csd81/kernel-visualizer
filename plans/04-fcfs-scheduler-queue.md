# Phase 4 — FCFS Scheduler + Queue Panel

## Goal
Implement First-Come-First-Served scheduling. Processes move between READY queue and RUNNING state each tick. Animated process cards in horizontal queues.

## Tasks

### 1. FCFS Scheduler logic
- On each `tick()`:
  1. If a process is currently RUNNING, decrement its `remainingTicks`
  2. If it reaches 0 → set `RUNNING → TERMINATED`, remove from process list, log completion
  3. If no process is RUNNING (or current just terminated) → dequeue the first READY process, set it to RUNNING
- Ready queue ordering: FIFO by `arrivalTime`

### 2. Scheduler loop integration
- Add `schedule()` call inside `tick()`, before `updateUI()`
- `schedule()`:
  ```js
  function schedule() {
    const running = sim.processes.find(p => p.state === 'RUNNING');
    if (running) {
      running.remainingTicks--;
      running.totalRunTicks++;
      if (running.remainingTicks <= 0) {
        running.state = 'TERMINATED';
        return; // will be picked up next tick
      }
      return; // still running
    }
    // No running process — pick next ready
    const next = sim.processes.find(p => p.state === 'READY');
    if (next) next.state = 'RUNNING';
  }
  ```

### 3. Process cards (HTML elements)
- For each process, create a `.process-card` div:
  ```html
  <div class="process-card" data-pid="1">
    <span class="proc-pid">PID 1</span>
    <span class="proc-state">RUNNING</span>
    <span class="proc-ticks">5/10</span>
  </div>
  ```
- Cards are coloured with the process color as a left border or background tint
- CSS `.process-card`: small card with `border-radius: 8px`, `padding: 0.5rem 0.75rem`, `font-size: 0.8rem`, `background: rgba(255,255,255,0.06)`, `border-left: 3px solid` (the process color)

### 4. Queue panel visual
- Scheduler panel shows two horizontal lanes:
  - **READY Queue**: flexbox row of process cards, overflow-x scroll
  - **RUNNING**: single process card slot (larger)
- Labels above each lane: "READY (N)" and "RUNNING"
- `updateSchedulerPanel()` re-renders cards from `sim.processes`
- Cards transition smoothly between lanes (CSS transition on `opacity` and `transform`)

### 5. Tick logging
- On each context switch, log: `"[tick 5] PID 1 → RUNNING"` / `"[tick 12] PID 1 → TERMINATED"`
- Keep a small context‑switch log array (last 20 events) for later Gantt chart use

### 6. Verify
- Start simulation → processes cycle through READY → RUNNING → TERMINATED
- Cards visually move from ready lane to running slot
- A process entering RUNNING stays there until its ticks are consumed
- TERMINATED cards fade out
- Console logs context switches
