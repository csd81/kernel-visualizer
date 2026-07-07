# Phase 11 — Memory Panel Drill-Down

## Goal
Make frames clickable to show allocation details. Implement page table abstraction per process. Simulate page faults.

## Tasks

### 1. Clickable frames
- Each `.memory-frame` gets a click handler
- On click:
  1. Highlight the frame with a bright border
  2. Show a tooltip/modal panel with details

### 2. Frame detail panel
- A fixed `<div id="frame-detail">` in the memory panel, initially hidden
- Contents:
  - **Frame Number**: N
  - **Owner**: PID X (or "Free")
  - **Process Name**: (if allocated)
  - **Logical Page**: page number (frame / pagesPerProcess)
  - **Offset**: byte offset within page
  - **Page Table Entry**: permissions, present bit
- Update on each frame click

### 3. Page table abstraction
- Each `Process` gains:
  ```js
  this.pageTable = []; // array of { frameNum, present: true, writable: true }
  ```
- On `alloc pid sizeKb`:
  - Create page table entries mapping logical pages to physical frames
  - For now, simple 1:1 mapping (page N → frame start+N)

### 4. Page fault simulation
- `simulatePageFault(pid, logicalPage)`:
  - Flash the grid red momentarily
  - Show alert badge: `"⚠️ PAGE FAULT — PID ${pid} page ${logicalPage}"`
  - Set the process state to BLOCKED
  - After 3 ticks (`setTimeout`), resolve the fault: load page, set process back to READY
- Can be triggered manually via command: `pfault pid pageNum`
- Track `sim.stats.pageFaults`

### 5. Page fault stats
- In memory panel header, add `"Page faults: N"`
- If page faults > 0 in last 50 ticks, show a small red sparkline

### 6. Verify
- Click a free frame → detail panel shows "Frame 42 — Free"
- Click an allocated frame → shows PID, logical page, offset
- `pfault 1 0` → grid flashes red, process 1 becomes BLOCKED, alert appears
- After ~3 ticks, process resumes, fault counter increments
