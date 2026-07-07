# Phase 9 — Memory Manager + 16×16 Frame Grid

## Goal
Create the 256-frame physical memory grid (16×16). Frames start gray (free). `alloc pid size_kb` assigns contiguous frames to a process. Frame ownership visualised by colour.

## Tasks

### 1. Memory data model
- `sim.memory = { frames: new Array(256), freeList: [...] }`
- Each frame: `{ pid: null, frameNum: index, used: false }`
- `PID_FREE = null` = gray

### 2. Frame colouring
- Free: `#2a2a35` (dark gray)
- Allocated to PID: the process color (from `processColor(pid)`)
- Occupied frame shows a subtle inner border or the PID number

### 3. 16×16 grid rendering
- In `#panel-memory .panel-content`, insert a `<div id="memory-grid">`
- CSS Grid: `grid-template-columns: repeat(16, 1fr)`, `gap: 2px`
- Each frame: `<div class="memory-frame" data-frame="N">` with `background-color` set inline
- Tooltip on hover: `"Frame N — PID ${pid || 'free'}"`

### 4. `alloc pid size_kb` command
- `alloc(pid, sizeKb)`:
  - Validates pid exists and process is not TERMINATED
  - Searches for `sizeKb` contiguous free frames (simple First Fit for now)
  - If found: marks each frame with pid, returns `"Allocated ${sizeKb} KB to PID ${pid} (frames ${start}-${end})"`
  - If not found: `"Error: insufficient contiguous memory (${freeContiguous} KB available)"`
- Expose on `window.__debug.alloc = alloc`

### 5. Memory stats
- Show in memory panel header:
  - `"Used: N / 256 frames (X%)"`
  - `"Largest free block: N KB"`
  - `"Fragmentation: X%"` (1 - largestFreeBlock / totalFreeFrames)

### 6. Verify
- Open page → 16×16 grid of dark gray frames visible in memory panel
- `alloc 1 8` → 8 frames change to process colour
- Hover shows PID in tooltip
- Stats update: used frames, largest free block, fragmentation %
- `alloc 1 300` → error (not enough memory)
