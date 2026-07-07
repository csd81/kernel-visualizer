# Phase 18 — Micro-Interactions & Data Readouts

## Goal
Add live data dashboards per subsystem: sparklines for CPU utilization, memory pressure, disk usage, page fault rate. Micro-interactions on cards/frames/blocks.

## Tasks

### 1. Sparkline utility
- Generic sparkline component:
  ```js
  function renderSparkline(containerId, data, color, maxPoints = 100)
  ```
- Renders a small SVG path: `M 0,${h} L ${i*w},${h-val*hScale} ...`
- Data array stores last N values, auto-shifts on push

### 2. CPU utilisation sparkline
- In scheduler panel: small sparkline showing CPU util % over last 100 ticks
- Update every tick: `sim.stats.cpuUtil.push(utilPercent)`

### 3. Memory pressure sparkline
- In memory panel: sparkline of used frame count over last 100 ticks
- Blue/cyan line

### 4. Disk usage sparkline
- In filesystem panel: sparkline of used data blocks over last 100 ticks
- Amber line

### 5. Page fault rate sparkline
- In memory panel (or small inset): page faults per 10-tick window
- Red line, only appears when > 0

### 6. Micro-interactions
- **Process cards**: hover expands slightly (scale 1.05), shows full details tooltip
- **Memory frames**: hover brightens frame, shows frame number overlay
- **Disk blocks**: hover shows `"Block 42 — Data — File: test.txt"`
- **Gantt bars**: hover shows exact ticks
- All with `transition: transform 0.15s, opacity 0.15s`

### 7. Live counters (compact stat tiles)
- Each panel gets a stat row at the top:
  - Scheduler: `⚡ CPU: 67%  |  ⤵ CTX: 42  |  ⏱ Ticks: 156`
  - Memory: `📦 Used: 84/256  |  📊 Frag: 12%  |  ⚠ PF: 3`
  - Filesystem: `💾 Blocks: 18/122  |  🗂 Files: 2  |  📉 Frag: 8%`
- Small icons + monospace numbers

### 8. Color-coded thresholds
- When values cross thresholds, numbers change colour:
  - CPU > 80%: yellow, > 95%: red
  - Memory > 80%: yellow, > 95%: red
  - Fragmentation > 50%: yellow, > 75%: red
- Use CSS classes `.stat-ok`, `.stat-warn`, `.stat-critical`

### 9. Verify
- Sparklines animate smoothly as ticks progress
- Stat tiles update every tick with current values
- Hover any interactive element → visual feedback
- Critical thresholds trigger colour changes
- No performance degradation after 1000+ ticks (sparklines cap at 100 points)
