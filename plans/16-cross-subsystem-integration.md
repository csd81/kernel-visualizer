# Phase 16 — Cross-Subsystem Integration

## Goal
Wire subsystems together so they interact: fork auto-reserves memory/kernel resources, kill frees them, memory pressure blocks processes, page faults trigger blocking.

## Tasks

### 1. Auto-reservation on fork
- When `fork(ticks, priority)` is called:
  - Reserve 1 memory frame for the process PCB (if possible)
  - Reserve 1 inode slot (mark as reserved for the process)
  - If memory is full → deny fork with error: `"Error: insufficient memory to create process"`
- Creates tighter coupling between subsystems

### 2. Kill cleans up resources
- When `kill(pid)` is called:
  1. Mark process TERMINATED
  2. Free all memory frames owned by that pid (call `freeMem(pid)`)
  3. Free any inodes owned by that pid
  4. Log: `"PID ${pid} terminated — freed ${N} frames, ${M} inodes"`

### 3. Blocked state from memory pressure
- If a RUNNING process encounters an allocation failure (e.g., `alloc` called but no free frames):
  - Enter BLOCKED state
  - Show blocked reason on the process card: `"BLOCKED (OOM)"`
  - Auto-retry every 3 ticks: when frames become available (from kills), the scheduler re-checks blocked processes and moves them back to READY
  - `schedule()` includes a `retryBlocked()` pass:
    - For each BLOCKED process, check if its pending allocation can now be satisfied
    - If yes → move to READY, log `"PID ${pid} unblocked (memory available)"`

### 4. Page fault integration
- `pfault pid pageNum`:
  1. Set process state to BLOCKED
  2. Show "PAGE FAULT" alert in memory panel
  3. After 3 ticks, resolve fault:
     - Allocate a frame for the page (if possible)
     - Update page table
     - Move process back to READY
  - If no frame available → stay BLOCKED until memory freed

### 5. Process resource display
- In the process table, add columns:
  - `Memory`: frames allocated
  - `Inode`: file handle count
- Shows resource usage per process

### 6. Resource tracking
- `sim.stats.totalFramesAllocated`, `sim.stats.totalInodesUsed`
- Update counters on alloc/free/fork/kill
- Display aggregate stats in a small footer bar

### 7. Verify
- `fork 10 2` → auto-reserves 1 frame, shown in process table
- `kill 1` → frees frames + inodes, visible in memory grid
- Allocate all memory → next process enters BLOCKED (OOM)
- Kill a process → blocked process unblocks when frames free up
- `pfault 1 0` → process blocks, 3 ticks later resumes
