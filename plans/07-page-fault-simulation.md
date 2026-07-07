# Phase 7 — Page Fault Simulation & Memory Drill-Down

## Goal
Simulate page faults: process enters BLOCKED state, frame flashes red, fault counter increments. Make frames clickable for full page table drill-down.

## Prerequisites
- Phase 6 (memory frame grid, allocation)

## Tasks

### 1. Page table per process
**Status: NOT DONE**

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
**Status: NOT DONE**

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
      ? { ...p, state: "BLOCKED" as const, blockedTick: state.tick }
      : p
  );

  const pageFaults = state.stats.pageFaults + 1;

  return {
    state: {
      ...state,
      processes,
      memory: { ...state.memory, faultFlash: true },
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
**Status: NOT DONE**

In the tick loop (`src/hooks/useSimulation.ts` — the `doTick` function), after scheduling, check for BLOCKED processes that have been blocked for ≥ 3 ticks and resolve them:

```ts
const processes = next.processes.map(p => {
  if (p.state === "BLOCKED" && next.tick - p.blockedTick >= 3) {
    return { ...p, state: "READY" as const };
  }
  return p;
});
```

### 4. Frame detail expansion
**Status: DONE** — Implemented in `FrameDetail.tsx` with full page table rendering.

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
**Status: DONE** — Wired in `MemoryPanel.tsx`.

Add a red badge to the memory panel header when `pageFaults > 0`:

```tsx
{state.stats.pageFaults > 0 && (
  <span className="text-[10px] text-red-400 font-mono">
    ⚠ PF: {state.stats.pageFaults}
  </span>
)}
```

### 6. Flash animation on fault
**Status: DONE** — Keyframe in `globals.css`, `flash` prop on `FrameGrid` accepts it.

Use CSS keyframes for a grid-wide red flash:

```css
@keyframes page-fault-flash {
  0% { box-shadow: inset 0 0 40px rgba(255, 0, 0, 0.3); }
  100% { box-shadow: inset 0 0 40px transparent; }
}
.animate-page-fault {
  animation: page-fault-flash 0.5s ease-out;
}
```

Apply the `.animate-page-fault` class to the `FrameGrid` wrapper for one tick when a fault occurs. The `MemoryState.faultFlash` boolean already exists and is passed as the `flash` prop to `FrameGrid`.

### 7. Pfault terminal command
**Status: NOT DONE**

Add a `case "pfault":` handler in `src/lib/terminal.ts`:

```ts
case "pfault": {
  const pid = parseInt(args[0]), page = parseInt(args[1]);
  if (isNaN(pid) || isNaN(page)) return { ...next, terminal: { ...next.terminal, output: addLine(output, "Usage: pfault <pid> <page>", "error") } };
  const result = simulatePageFault(next, pid, page);
  output = addLine(output, result.message, "warning");
  return { ...result.state, terminal: { ...result.state.terminal, output } };
}
```

### 8. Set `blockedTick` on BLOCKED transition
**Status: NOT DONE**

`blockedTick` exists on the Process type but is never set when a process enters BLOCKED. Both `simulatePageFault` and the deadlock preset need to write `blockedTick = state.tick`.

### 9. Renice command
**Status: NOT DONE**

Listed in `help` output but has no handler in `terminal.ts`. Implement a handler that updates the target process's priority.

## Acceptance Criteria
- [x] Frame detail shows page table for the owning process
- [x] Memory grid briefly flashes red on fault
- [x] Page fault alert badge renders when pageFaults > 0
- [ ] `pfault 1 0` → process 1 enters BLOCKED state, pageFaults counter increments
- [ ] After 3 ticks, BLOCKED process auto-resolves to READY
- [ ] `free 1` clears both frames and page table entries
- [ ] `renice` command changes process priority
- [ ] `blockedTick` is set when a process transitions to BLOCKED

## Files Touched
- `src/lib/memory.ts` — simulatePageFault, resolvePageFault, buildPageTable, populate pageTable on alloc
- `src/types/process.ts` — blockedTick field (type exists, but never written)
- `src/hooks/useSimulation.ts` — auto-resolve blocked processes in `doTick`
- `src/lib/terminal.ts` — pfault and renice command handlers
- `src/components/memory/FrameDetail.tsx` — page table display ✅
- `src/components/panels/MemoryPanel.tsx` — fault badge ✅, flash ✅
- `src/app/globals.css` — page-fault-flash keyframe ✅
