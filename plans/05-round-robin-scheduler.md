# Phase 5 — Round Robin Scheduler

## Goal
Add Round Robin scheduling with a configurable time quantum. Preempt the running process when its quantum expires and re-queue it. Allow switching between FCFS and RR.

## Tasks

### 1. Algorithm selector
- Add `sim.scheduler = 'fcfs'` (or `'rr'`) to sim state
- UI dropdown `<select id="sched-algo">` in scheduler panel header:
  - `First-Come-First-Served`
  - `Round Robin`
- On change, update `sim.scheduler` (and reset running process to READY for clean state)

### 2. Time quantum
- Add `sim.quantum = 3` (default 3 ticks)
- Small number input or slider next to the algorithm dropdown, labelled "Quantum"
- Clamp min 1, max 20

### 3. RR scheduling logic
- Track ticks spent by current running process in `Process.currentQuantumTicks`
- In `schedule()`, if `sim.scheduler === 'rr'`:
  - Decrement `remainingTicks`, increment `currentQuantumTicks`
  - If process completes → TERMINATED
  - If `currentQuantumTicks >= sim.quantum` → preempt:
    1. If process still has work → move to end of READY queue, set state READY
    2. Pick next READY process, set RUNNING, reset its `currentQuantumTicks = 0`
- FCFS path unchanged

### 4. Quantum countdown ring
- On the running process card, overlay a small circular progress ring that depletes as the quantum ticks down
- SVG `<circle>` with `stroke-dasharray` and `stroke-dashoffset` animation
- Only visible in RR mode

### 5. Scheduler stats display
- Show in scheduler panel:
  - Current algorithm name
  - Quantum value (RR only)
  - Number of context switches so far (`sim.contextSwitches`)
  - Increment on every state change READY → RUNNING

### 6. Verify
- Switch to RR with quantum 3
- Process runs for 3 ticks, then gets preempted (visible: card moves back to ready queue, next card takes running slot)
- Quantum slider changes behaviour in real time
- FCFS path still works after switching back
- Context switch counter increments on preempt
