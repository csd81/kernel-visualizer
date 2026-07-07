# Phase 7 — Process Lifecycle Animations

## Goal
Add CSS transitions/animations for process cards as they move between states. Implement `fork` and `kill` shell commands.

## Tasks

### 1. CSS transitions on process cards
- Default state: `opacity: 1; transform: scale(1); transition: all 0.3s ease`
- **ENTERING** (new fork): start `opacity: 0; transform: scale(0.8)` → animate to full size
- **RUNNING** card: subtle pulse animation (`@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(...) } 70% { box-shadow: 0 0 0 8px rgba(...) } }`)
- **BLOCKED** card: `opacity: 0.5; filter: grayscale(0.5)` with a lock icon overlay
- **TERMINATED**: `opacity: 0; transform: translateY(20px) scale(0.9)` then remove from DOM after transition ends (`transitionend` event)

### 2. Queue movement animation
- Cards moving from READY lane → RUNNING slot: `transform: translateX(...)` with a smooth 0.3s ease
- Re-ordering in the READY queue due to RR preempt: use `FLIP` technique or Vue-like keyed transitions — simplest: just re-render and let CSS transitions smooth (if we re-append the element the browser may not animate; use `requestAnimationFrame` + class toggle)
- Approach: use a container per queue, let flexbox order determine position, and transition on `margin-left`/`transform`

### 3. `fork` command
- `fork(ticks, priority)`:
  - Default `ticks = 10`, `priority = 0`
  - Validate: ticks 1–100, priority 0–9
  - Create new `Process(nextPid, ticks, priority)`, set arrival to current tick
  - Add to `sim.processes`
  - Return `"Created PID ${pid}"` message
- Expose on `window.__debug.fork = fork`

### 4. `kill` command
- `kill(pid)`:
  - Find process, set state to TERMINATED, log `"PID ${pid} terminated"`
  - If not found → `"Error: unknown PID"`
  - If already TERMINATED → `"Error: PID ${pid} already terminated"`
- Card fades out with the TERMINATED animation, then removed from array

### 5. Animation guard
- After setting TERMINATED, do NOT immediately `splice` from `sim.processes` — mark it, wait 600 ms (matching CSS transition), then clean up
- Use `setTimeout` in `tick()` or a dedicated cleanup pass every few ticks

### 6. Verify
- Call `fork(15, 3)` → new card appears with scale-in animation in READY queue
- Process enters RUNNING with pulse glow
- `kill 1` → card fades out and is removed after animation
- Cards move between queues with smooth transitions
