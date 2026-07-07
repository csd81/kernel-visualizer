# Phase 12 — Cross-Subsystem Integration

## Goal
Wire subsystems together: fork auto-reserves resources, kill cleans up, memory pressure blocks processes, page faults auto-retry.

## Prerequisites
- All prior phases (scheduler, memory, filesystem, terminal wired)

## Tasks

### 1. Auto-reservation on fork
**Status: NOT DONE**

`fork()` in `src/lib/scheduler.ts` does not check available memory or reserve a frame for the new process's PCB. Modify it to:

```ts
export function fork(state: SimState, ticks: number, priority: number): { state: SimState; message: string } {
  if (state.processes.length >= MAX_PID) return { state, message: "Error: maximum processes reached" };

  // Check memory before creating
  const freeFrames = state.memory.frames.filter(f => f.pid === null).length;
  if (freeFrames < 1) {
    return { state, message: "Error: insufficient memory to create process" };
  }

  const pid = state.nextPid;
  const nextPidVal = (pid % MAX_PID) + 1;
  const proc = createProcess(pid, ticks, priority, state.tick);

  // Auto-reserve 1 frame for PCB
  const allocResult = allocateFrames(state.memory, pid, 1);
  if (allocResult.message) {
    return { state, message: `Error: ${allocResult.message}` };
  }

  // Record the reserved frame in holds
  proc.holds = [...allocResult.allocated];
  proc.pageTable = buildPageTable(allocResult.allocated);

  return {
    state: {
      ...state,
      nextPid: nextPidVal,
      processes: [...state.processes, proc],
      memory: allocResult.memory,
    },
    message: `Created PID ${pid} (${ticks} ticks, pri ${priority}, 1 frame reserved)`,
  };
}
```

### 2. Kill cleans up resources
**Status: NOT DONE**

`kill()` in `src/lib/scheduler.ts` only marks the process as TERMINATED — it does not free memory or file handles. Modify it to:

```ts
export function kill(state: SimState, pid: number): { state: SimState; message: string } {
  const idx = state.processes.findIndex(p => p.pid === pid);
  if (idx === -1) return { state, message: `Error: unknown PID ${pid}` };
  const proc = state.processes[idx];
  if (proc.state === "TERMINATED") return { state, message: `Error: PID ${pid} already terminated` };

  // Free memory
  const memory = freeProcessFrames(state.memory, pid);

  // Free any file handles owned by this process
  const disk = {
    ...state.disk,
    inodes: state.disk.inodes.map(i =>
      i.pid === pid ? { ...i, used: false, fileName: null, size: 0, blocks: [], pid: null } : i
    ),
    blocks: state.disk.blocks.map(b =>
      b.pid === pid ? { ...b, used: false, pid: null, fileId: null } : b
    ),
  };

  const processes = state.processes.map(p =>
    p.pid === pid ? { ...p, state: "TERMINATED" as ProcessState, terminatedTick: state.tick } : p
  );

  return {
    state: { ...state, processes, memory, disk },
    message: `PID ${pid} terminated — freed ${proc.holds.length} frames`,
  };
}
```

### 3. Blocked state from memory pressure / retryBlockedProcesses
**Status: NOT DONE**

No mechanism exists for processes to enter BLOCKED due to failed memory allocations, and no retry logic exists. Add:

**File: `src/lib/scheduler.ts`**

```ts
export function retryBlockedProcesses(state: SimState): SimState {
  let memory = state.memory;
  let processes = state.processes;

  for (const proc of processes) {
    if (proc.state !== "BLOCKED" || proc.waitsFor === -1) continue;
    // Try to allocate the frame the process was waiting for
    const result = allocateFrames(memory, proc.pid, 1);
    if (!result.message) {
      memory = result.memory;
      processes = processes.map(p =>
        p.pid === proc.pid
          ? { ...p, state: "READY" as ProcessState, waitsFor: -1, readyTick: state.tick }
          : p
      );
    }
  }
  return { ...state, memory, processes };
}
```

Call `retryBlockedProcesses` in the `doTick` function in `useSimulation.ts`, alongside the existing `resolveBlockedProcesses` call.

### 4. Page fault auto-resolution
**Status: DONE**

`resolveBlockedProcesses()` in `src/hooks/useSimulation.ts` checks for BLOCKED processes that have been blocked for ≥3 ticks (via `blockedTick`) and calls `resolvePageFault()` to transition them to READY. This works because `simulatePageFault()` in `src/lib/memory.ts` now sets `blockedTick: state.tick`.

### 5. Resource display in process table
**Status: PARTIALLY DONE**

`ProcessTable.tsx` already has a "Mem" column showing `p.holds.length`. No file-handle column exists yet.

### 6. Bonus: Gantt chart duration patching
**Status: DONE**

All four scheduler variants (`scheduleFcfs`, `scheduleRr`, `schedulePriority`, `scheduleMlfq`) call `patchDuration()` when a process is terminated or preempted. This backfills `duration` on the preceding `scheduled` entry, fixing the Phase 5 Gantt chart gap — bars now render correctly.

### 7. Bonus: buildPageTable on alloc
**Status: DONE**

`buildPageTable()` exists in `src/lib/memory.ts`. The `alloc` terminal handler calls it and attaches the page table entries to the target process.

## Acceptance Criteria
- [ ] `fork 10 2` reserves 1 memory frame (visible in frame grid and ProcessTable Mem column)
- [ ] `kill 1` frees both the process and its memory frames
- [ ] Fill all memory → next `fork` fails with "insufficient memory"
- [ ] Kill a process that owns frames → blocked processes waiting for those frames may unblock
- [x] `pfault 1 0` blocks process → resolves after 3 ticks
- [x] Process table shows frame count (Mem column)
- [ ] Process table shows file handle count
- [x] Gantt chart bars render correctly (duration patched)

## Files Touched
- `src/lib/scheduler.ts` — fork (memory check + reservation), kill (cleanup), retryBlockedProcesses
- `src/hooks/useSimulation.ts` — integrate retryBlockedProcesses into doTick
- `src/lib/memory.ts` — built existing ✅ (buildPageTable, simulatePageFault, resolvePageFault)
- `src/components/scheduler/ProcessTable.tsx` — file handle column (missing)
- `src/lib/terminal.ts` — pfault handler ✅, alloc builds page table ✅
