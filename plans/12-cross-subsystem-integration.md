# Phase 12 — Cross-Subsystem Integration

## Goal
Wire subsystems together: fork auto-reserves resources, kill cleans up, memory pressure blocks processes, page faults auto-retry.

## Prerequisites
- All prior phases (scheduler, memory, filesystem, terminal wired)

## Tasks

### 1. Auto-reservation on fork

Modify `fork()` in `src/lib/scheduler.ts`:

```ts
export function fork(state: SimState, ticks: number, priority: number): { state: SimState; message: string } {
  // Check memory before creating
  const freeFrames = state.memory.frames.filter(f => f.pid === null).length;
  if (freeFrames < 1) {
    return { state, message: "Error: insufficient memory to create process" };
  }

  const proc = createProcess(ticks, priority);
  proc.arrivalTick = state.tick;

  // Auto-reserve 1 frame for PCB
  const allocResult = allocateFrames(state.memory, proc.pid, 1);
  if (allocResult.message) {
    return { state, message: `Error: ${allocResult.message}` };
  }

  return {
    state: {
      ...state,
      processes: [...state.processes, proc],
      memory: allocResult.memory,
    },
    message: `Created PID ${proc.pid} (${ticks} ticks, pri ${priority}, 1 frame reserved)`,
  };
}
```

### 2. Kill cleans up resources

Modify `kill()`:

```ts
export function kill(state: SimState, pid: number): { state: SimState; message: string } {
  const idx = state.processes.findIndex(p => p.pid === pid);
  if (idx === -1) return { state, message: `Error: unknown PID ${pid}` };

  const proc = state.processes[idx];
  if (proc.state === "TERMINATED") return { state, message: `Error: PID ${pid} already terminated` };

  // Free memory
  const memory = freeProcessFrames(state.memory, pid);

  // Free any file handles
  const disk = {
    ...state.disk,
    inodes: state.disk.inodes.map(i =>
      i.pid === pid ? { ...i, used: false, fileName: null, size: 0, blocks: [], pid: null } : i
    ),
    blocks: state.disk.blocks.map(b =>
      b.pid === pid ? { ...b, used: false, pid: null, fileId: null } : b
    ),
  };

  const processes = state.processes.map(p => p.pid === pid ? { ...p, state: "TERMINATED" as const } : p);
  return {
    state: { ...state, processes, memory, disk },
    message: `PID ${pid} terminated — freed ${proc.holds.length} frames`,
  };
}
```

### 3. Blocked state from memory pressure

In the scheduler's tick, if a process tries to allocate but frames are unavailable → BLOCKED. Add a `retryBlockedProcesses` check:

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
        p.pid === proc.pid ? { ...p, state: "READY" as const, waitsFor: -1 } : p
      );
    }
  }

  return { ...state, memory, processes };
}
```

Call `retryBlockedProcesses` at the start of `tick()`.

### 4. Page fault auto-resolution

In the tick loop, auto-resolve BLOCKED processes that are blocked due to page faults (not resource wait). Add `blockedTick` tracking:

```ts
// In tick(), after scheduling:
processes = processes.map(p => {
  if (p.state === "BLOCKED" && p.waitsFor === -1 && state.tick - (p as any).blockedTick >= 3) {
    return { ...p, state: "READY" as const };
  }
  return p;
});
```

### 5. Resource display in process table

Augment `ProcessTable.tsx` with columns:
- `Frames`: number of frames held (process.holds.length)
- `File`: "F" badge if process owns an inode

## Acceptance Criteria
- [ ] `fork 10 2` reserves 1 memory frame (visible in frame grid)
- [ ] `kill 1` frees both the process and its memory frames
- [ ] Fill all memory → next `fork` fails with "insufficient memory"
- [ ] Kill a process that owns frames → blocked processes may unblock
- [ ] `pfault 1 0` blocks process → resolves after 3 ticks
- [ ] Process table shows frames and file handle counts

## Files Touched
- `src/lib/scheduler.ts` — fork, kill with resource cleanup, retryBlockedProcesses
- `src/lib/sim.ts` — integrate retryBlockedProcesses and auto-resolve into tick
- `src/components/scheduler/ProcessTable.tsx` — frames and file columns
