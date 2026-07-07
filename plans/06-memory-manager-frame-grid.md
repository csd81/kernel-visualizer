# Phase 6 — Memory Manager & 16×16 Frame Grid

## Goal
Create the 256-frame physical memory grid (16×16). Frames start gray (free). First Fit and Best Fit allocation. `alloc` and `free` commands.

## Prerequisites
- Phase 3 (process data model, tick loop)

## Tasks

### 1. Memory types

**File: `src/types/memory.ts`**

```ts
export interface Frame {
  id: number;
  pid: number | null;  // null = free
}

export interface MemoryState {
  frames: Frame[];
  algorithm: "first-fit" | "best-fit";
}

export interface PageTableEntry {
  logicalPage: number;
  frameNum: number;
  present: boolean;
}
```

### 2. Memory engine

**File: `src/lib/memory.ts`**

```ts
import type { Frame, MemoryState, PageTableEntry } from "@/types/memory";

export const TOTAL_FRAMES = 256;
export const FRAME_SIZE = 1024; // 1 KB per frame

export function createInitialMemory(): MemoryState {
  return {
    frames: Array.from({ length: TOTAL_FRAMES }, (_, i) => ({ id: i, pid: null })),
    algorithm: "first-fit",
  };
}

export function firstFit(frames: Frame[], sizeKb: number): number {
  let start = -1;
  let count = 0;
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].pid === null) {
      if (start === -1) start = i;
      count++;
      if (count >= sizeKb) return start;
    } else {
      start = -1;
      count = 0;
    }
  }
  return -1;
}

export function bestFit(frames: Frame[], sizeKb: number): number {
  let bestStart = -1;
  let bestSize = Infinity;
  let i = 0;
  while (i < frames.length) {
    if (frames[i].pid === null) {
      const start = i;
      let count = 0;
      while (i < frames.length && frames[i].pid === null) { count++; i++; }
      if (count >= sizeKb && count < bestSize) {
        bestStart = start;
        bestSize = count;
      }
    } else {
      i++;
    }
  }
  return bestStart;
}

export function allocateFrames(
  state: MemoryState,
  pid: number,
  sizeKb: number
): { memory: MemoryState; allocated: number[]; message: string | null } {
  const frames = [...state.frames];
  const fn = state.algorithm === "best-fit" ? bestFit : firstFit;
  const start = fn(frames, sizeKb);
  if (start === -1) {
    const totalFree = frames.filter(f => f.pid === null).length;
    const largest = largestFreeBlock(frames);
    return { memory: state, allocated: [], message: `Error: insufficient contiguous memory (${largest} KB largest, ${totalFree} KB total free)` };
  }
  const allocated = [];
  for (let i = start; i < start + sizeKb; i++) {
    frames[i] = { ...frames[i], pid };
    allocated.push(i);
  }
  return { memory: { ...state, frames }, allocated, message: null };
}

export function freeProcessFrames(state: MemoryState, pid: number): MemoryState {
  return {
    ...state,
    frames: state.frames.map(f => f.pid === pid ? { ...f, pid: null } : f),
  };
}

export function largestFreeBlock(frames: Frame[]): number {
  let max = 0, cur = 0;
  for (const f of frames) {
    if (f.pid === null) { cur++; max = Math.max(max, cur); }
    else cur = 0;
  }
  return max;
}
```

### 3. Frame grid component

**File: `src/components/memory/FrameGrid.tsx`**

```tsx
"use client";

import type { Frame } from "@/types/memory";
import { processColor } from "@/lib/colors";

interface Props {
  frames: Frame[];
  onSelect: (frame: Frame) => void;
}

export default function FrameGrid({ frames, onSelect }: Props) {
  return (
    <div className="grid grid-cols-16 gap-[2px]">
      {frames.map(f => (
        <button
          key={f.id}
          onClick={() => onSelect(f)}
          className="aspect-square rounded-sm text-[6px] font-mono transition-all duration-200 hover:brightness-150 hover:scale-110 cursor-pointer border-0"
          style={{
            backgroundColor: f.pid !== null ? processColor(f.pid) : "#2a2a35",
          }}
          title={`Frame ${f.id} — ${f.pid !== null ? `PID ${f.pid}` : "free"}`}
        />
      ))}
    </div>
  );
}
```

Add `grid-template-columns: repeat(16, 1fr)` to `globals.css`:
```css
.grid-cols-16 { grid-template-columns: repeat(16, 1fr); }
```

### 4. Frame detail panel

**File: `src/components/memory/FrameDetail.tsx`**

```tsx
import type { Frame } from "@/types/memory";
import type { Process } from "@/types/process";

interface Props {
  frame: Frame | null;
  processes: Process[];
}

export default function FrameDetail({ frame, processes }: Props) {
  if (!frame) return <div className="text-text-muted text-[10px] italic mt-2">Click a frame to inspect</div>;
  const owner = processes.find(p => p.pid === frame.pid);
  return (
    <div className="mt-2 p-2 rounded-lg bg-white/6 text-[10px] font-mono space-y-0.5">
      <div><span className="text-text-muted">Frame:</span> {frame.id}</div>
      <div><span className="text-text-muted">Owner:</span> {frame.pid !== null ? `PID ${frame.pid}${owner ? ` (${owner.state})` : ""}` : "Free"}</div>
      {frame.pid !== null && (
        <>
          <div><span className="text-text-muted">Logical Page:</span> {Math.floor(frame.id / 4)}</div>
          <div><span className="text-text-muted">Offset:</span> {frame.id * 1024}–{(frame.id + 1) * 1024 - 1}</div>
        </>
      )}
    </div>
  );
}
```

### 5. Memory stats

```ts
export function memoryStats(memory: MemoryState) {
  const totalFree = memory.frames.filter(f => f.pid === null).length;
  const largest = largestFreeBlock(memory.frames);
  const used = TOTAL_FRAMES - totalFree;
  const fragPct = totalFree > 0 ? Math.round((1 - largest / totalFree) * 100) : 0;
  return { used, total: TOTAL_FRAMES, totalFree, largestFreeBlock: largest, fragPct };
}
```

### 6. MemoryPanel

**File: `src/components/panels/MemoryPanel.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useSimulation } from "@/hooks/SimulationContext";
import FrameGrid from "../memory/FrameGrid";
import FrameDetail from "../memory/FrameDetail";
import { memoryStats } from "@/lib/memory";

export default function MemoryPanel() {
  const { state } = useSimulation();
  const [selected, setSelected] = useState<Frame | null>(null);
  const stats = memoryStats(state.memory);

  return (
    <section className="rounded-xl bg-white/3 backdrop-blur-xl border border-white/6 p-5
      [border-color:var(--color-accent-memory)]/30
      hover:[border-color:var(--color-accent-memory)]/60 transition-colors">
      <h2 className="text-xs uppercase tracking-[0.12em] text-text-muted mb-3">Memory</h2>
      <div className="text-[10px] font-mono text-text-secondary mb-2 space-x-3">
        <span>Used: {stats.used}/{stats.total}</span>
        <span>Free: {stats.totalFree}</span>
        <span className={stats.fragPct > 60 ? "text-red-400" : stats.fragPct > 25 ? "text-yellow-400" : ""}>
          Frag: {stats.fragPct}%
        </span>
      </div>
      <FrameGrid frames={state.memory.frames} onSelect={setSelected} />
      <FrameDetail frame={selected} processes={state.processes} />
    </section>
  );
}
```

### 7. Alloc/free commands via context

- `alloc(pid, sizeKb)` → calls `allocateFrames`, returns result message
- `freeMem(pid)` → calls `freeProcessFrames`, returns message

Expose both from `SimulationContext` and `useSimulation`.

## Acceptance Criteria
- [x] Memory panel shows a 16×16 grid of dark gray frames
- [x] `alloc 1 8` → 8 frames turn to process PID 1's color
- [x] Free frames remain gray
- [x] Click a frame → detail panel shows frame ID, owner, page, offset
- [x] Stats update: used/total, largest free block, fragmentation %
- [x] `alloc 1 300` → error (out of memory)
- [x] `freeMem 1` → frames return to gray

## Files Touched
- `src/types/memory.ts` — Frame, MemoryState, PageTableEntry
- `src/lib/memory.ts` — all allocation logic
- `src/components/memory/FrameGrid.tsx` — new
- `src/components/memory/FrameDetail.tsx` — new
- `src/components/panels/MemoryPanel.tsx` — wire grid + detail
- `src/hooks/SimulationContext.tsx` — alloc, freeMem
- `src/app/globals.css` — grid-cols-16
