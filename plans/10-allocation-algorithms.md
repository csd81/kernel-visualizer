# Phase 10 — Allocation Algorithms (First Fit / Best Fit)

## Goal
Implement First Fit and Best Fit memory allocation. Add algorithm toggle. Show fragmentation counter.

## Tasks

### 1. Algorithm selector
- Add `sim.memAlgorithm = 'first-fit'` to sim state
- Dropdown in memory panel header: `First Fit` / `Best Fit`
- On change, update `sim.memAlgorithm`

### 2. First Fit (existing, refactor)
- Scan from frame 0, pick first contiguous gap large enough
- Already implemented in Phase 9 — just extract to `allocateFirstFit(pid, sizeKb)`

### 3. Best Fit
- `allocateBestFit(pid, sizeKb)`:
  - Scan all free gaps
  - Pick the smallest gap that is ≥ requested size
  - Minimises leftover fragmentation but is slower to scan
- Implement as a separate function, called based on `sim.memAlgorithm`

### 4. Allocation animation
- When frames are allocated, do a brief ripple effect:
  - CSS `@keyframes frameAlloc { 0% { transform: scale(1.3); opacity: 0.5 } 100% { transform: scale(1); opacity: 1 } }`
  - Apply class `.just-allocated` to each newly assigned frame, remove after 500 ms
- On free: flash white then fade to gray

### 5. Fragmentation analysis
- After each alloc/free, recompute:
  - `totalFree`: count of unallocated frames
  - `largestFreeBlock`: longest contiguous free run
  - `externalFragPct`: `(1 - largestFreeBlock / totalFree) * 100` (if totalFree > 0; else 0)
  - Display as a small coloured bar: green (< 25%), yellow (25–60%), red (> 60%)

### 6. Free command
- `free(pid)`:
  - Frees all frames owned by pid
  - Returns `"Freed N frames for PID ${pid}"`
  - Flash animation on freed frames

### 7. Verify
- Allocate several blocks with First Fit, then Best Fit, compare placement
- Fragmentation % changes as blocks are allocated and freed
- Flash/ripple animation on alloc and free
- Freeing a PID resets frames to gray
