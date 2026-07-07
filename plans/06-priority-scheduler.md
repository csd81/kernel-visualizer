# Phase 6 — Priority Scheduler

## Goal
Implement priority-based scheduling (priority levels 0–9, higher = better). Visualise priority queues stacked vertically. Add `renice` command.

## Tasks

### 1. Priority levels
- `sim.processes` gains a convenience accessor: `getReadyQueue(priority)` filters by state READY and matching priority
- `getHighestPriorityReady()`: scans priorities 9 → 0, returns first READY process found

### 2. Priority scheduling logic
- In `schedule()`, when `sim.scheduler === 'priority'`:
  1. Decrement current RUNNING process as usual
  2. On completion or preemption → pick `getHighestPriorityReady()`
- No time quantum preemption in basic priority mode (non-preemptive)
- Later: add preemptive option via checkbox

### 3. Algorithm selector update
- Add `Priority` option to the `<select id="sched-algo">` dropdown

### 4. Multi-queue visual
- In scheduler panel, render READY queues as stacked horizontal lanes (0–9, but only show non-empty ones)
- Each lane labelled `"PRI 9"`, `"PRI 8"`, etc.
- Priority badge on each process card: small circle or pill with the priority number
- RUNNING slot stays a single card at the top

### 5. `renice` command stub
- `renice(pid, newPriority)`:
  - Looks up process by pid
  - If not found → `"Error: unknown PID"`
  - If TERMINATED → `"Error: process already terminated"`
  - Clamp priority to 0–9, update `process.priority`
  - Return success message
- Expose on `window.__debug.renice = renice`

### 6. Starvation warning
- Track ticks since each READY process last ran (`Process.ticksSinceRun`)
- If any READY process has `ticksSinceRun > 50`, show a small yellow warning badge in the scheduler panel
- `"⚠️ Starvation risk: PID N hasn't run in 50+ ticks"`

### 7. Verify
- Create processes with varying priorities (0, 5, 9)
- Switch to Priority mode
- Priority 9 process always runs before priority 5
- Renice a running process to a different priority and observe lane change
- Starvation warning appears for low-priority processes left behind
