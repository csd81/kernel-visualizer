# Phase 2 — Tick Loop & Clock

## Goal
Build the simulation clock: `setInterval`-based tick loop with play/pause control, speed adjustment, and a live clock readout in the header.

## Tasks

### 1. Tick loop
- `start()`: calls `tick()` then sets `sim.intervalId = setInterval(tick, sim.speed)`
- `stop()`: `clearInterval(sim.intervalId)`, sets `sim.intervalId = null`
- `tick()` increments `sim.tick`, calls `updateUI()`, logs `"[tick ${sim.tick}]"` to console

### 2. Pause / Resume
- `pause()` and `resume()` functions that toggle `sim.running`
- Stub shell commands `pause` and `resume` that call these (real shell wiring comes in Phase 14)
- For now, expose them on `window.__debug` for console testing:
  ```js
  window.__debug = { start, stop, pause, resume };
  ```

### 3. Speed adjustment
- `setSpeed(ms)` updates `sim.speed`, restarts the interval if running
- `speed [ms]` shell stub
- Clamp speed between 50 ms and 2000 ms

### 4. Header clock readout
- `<span id="tick-counter">` already exists
- `updateUI()` updates it to `"tick: ${sim.tick}"`
- Add a small control bar in the header:
  - Play/Pause button (`#btn-pause`)
  - Speed slider (`<input type="range" min="50" max="2000" value="500">`) with label showing current ms
- Wire the button and slider to `pause()`, `resume()`, `setSpeed()`

### 5. Verify
- Open page → clock shows "tick: 0"
- Click play → ticks increment every 500 ms
- Adjust slider → speed changes in real time
- Click pause → counter freezes
- Console shows `[tick 1]`, `[tick 2]`, …
