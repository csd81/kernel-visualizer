# Phase 7 — Page Fault Simulation & Memory Drill-Down

## Goal
Simulate page faults: process enters BLOCKED state, frame flashes red, fault counter increments. Make frames clickable for full page table drill-down.

## Prerequisites
- Phase 6 (memory frame grid, allocation)

## Tasks

### 1. Page table per process

Each `Process` already has a `pageTable: PageTableEntry[]`. On `alloc`, populate it:

```ts
// In allocateFrames, after assigning frames:
export function buildPageTable(allocated: number[], pid: number): PageTableEntry[] {
  return allocated.map((frameNum, i) => ({
    logicalPage: i,
    frameNum,
    present: true,
  }));
}
```

### 2. Page fault simulation

**File: `src/lib/memory.ts`**

```ts
export function simulatePageFault(
  state: SimState,
  pid: number,
  logicalPage: number
): { state: SimState; message: string } {
  const proc = state.processes.find(p => p.pid === pid);
  if (!proc) return { state, message: `Error: unknown PID ${pid}` };
  if (proc.state === "TERMINATED") return { state, message: `Error: PID ${pid} is terminated` };

  const processes = state.processes.map(p =>
    p.pid === pid
      ? { ...p, state: "BLOCKED" as const }
      : p
  );

  const pageFaults = state.stats.pageFaults + 1;

  return {
    state: {
      ...state,
      processes,
      stats: { ...state.stats, pageFaults },
    },
    message: `⚠️ PAGE FAULT — PID ${pid} page ${logicalPage} (total: ${pageFaults})`,
  };
}

export function resolvePageFault(state: SimState, pid: number): SimState {
  return {
    ...state,
    processes: state.processes.map(p =>
      p.pid === pid && p.state === "BLOCKED"
        ? { ...p, state: "READY" as const }
        : p
    ),
  };
}
```

### 3. Auto-resolve page faults

In the tick loop, after scheduling, check for BLOCKED processes that have been blocked for ≥ 3 ticks and resolve them:

```ts
// In tick()
const processes = next.processes.map(p => {
  if (p.state === "BLOCKED") {
    // Track blockedTick — add to Process type
    if (state.tick - p.blockedTick >= 3) {
      return { ...p, state: "READY" as const };
    }
  }
  return p;
});
```

### 4. Frame detail expansion

**File: `src/components/memory/FrameDetail.tsx`**

Show full page table for the owning process when a frame is selected:

```tsx
{owner && owner.pageTable.length > 0 && (
  <div className="mt-2">
    <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Page Table (PID {owner.pid})</div>
    <table className="w-full text-[9px] font-mono">
      <thead>
        <tr className="text-text-muted">
          <th className="text-left pr-2">Page</th>
          <th className="text-left pr-2">Frame</th>
          <th className="text-left">Present</th>
        </tr>
      </thead>
      <tbody>
        {owner.pageTable.map(pte => (
          <tr key={pte.logicalPage} className="border-t border-white/5">
            <td className="pr-2 py-0.5">{pte.logicalPage}</td>
            <td className="pr-2 py-0.5">{pte.frameNum}</td>
            <td className="py-0.5">{pte.present ? "✓" : "✗"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
```

### 5. Page fault alert badge

Add a red badge to the memory panel header when `pageFaults > 0`:

```tsx
{state.stats.pageFaults > 0 && (
  <span className="text-[10px] text-red-400 font-mono">
    ⚠ PF: {state.stats.pageFaults}
  </span>
)}
```

### 6. Flash animation on fault

Use CSS keyframes for a grid-wide red flash:

```css
@keyframes page-fault-flash {
  0% { box-shadow: inset 0 0 40px rgba(255, 0, 0, 0.3); }
  100% { box-shadow: inset 0 0 40px transparent; }
}
.page-fault {
  animation: page-fault-flash 0.5s ease-out;
}
```

Apply the `.page-fault` class to the `FrameGrid` wrapper for one tick when a fault occurs.

### 7. Expose via context

Add `pfault(pid, page)` and `freeMem(pid)` actions to `SimulationContext`.

## Acceptance Criteria
- [ ] `pfault 1 0` → process 1 enters BLOCKED state, alert badge increments
- [ ] Memory grid briefly flashes red
- [ ] After 3 ticks, process auto-resolves to READY
- [ ] Click a frame → shows page table for the owning process
- [ ] `freeMem 1` clears both frames and page table entries

## Files Touched
- `src/lib/memory.ts` — simulatePageFault, resolvePageFault, buildPageTable
- `src/types/process.ts` — add blockedTick to Process
- `src/lib/sim.ts` — auto-resolve blocked processes in tick
- `src/components/memory/FrameDetail.tsx` — page table display
- `src/components/panels/MemoryPanel.tsx` — fault badge, flash
- `src/app/globals.css` — page-fault-flash keyframe
- `src/hooks/SimulationContext.tsx` — pfault, freeMem
