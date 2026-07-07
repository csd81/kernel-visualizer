# Phase 1 — Project Skeleton

## Goal
Scaffold the Next.js project, set up Tailwind theme tokens for the glassmorphic design system, create the four-panel dashboard layout, and wire the clock tick display.

## Prerequisites
- Phase 0 (foundations, conventions, structure)

## Tasks

### 1. Configure Tailwind theme tokens

**File: `src/app/globals.css`**

Replace the default template with:

```css
@import "tailwindcss";

@theme inline {
  --color-bg-base: #0b0e14;
  --color-bg-panel: rgba(255, 255, 255, 0.03);
  --color-bg-panel-hover: rgba(255, 255, 255, 0.06);
  --color-border-panel: rgba(255, 255, 255, 0.06);
  --color-border-panel-hover: rgba(255, 255, 255, 0.12);
  --color-accent-scheduler: #00e5ff;
  --color-accent-memory: #d500f9;
  --color-accent-filesystem: #ffab00;
  --color-accent-terminal: #33ff33;
  --color-text-primary: #e8eaed;
  --color-text-secondary: rgba(232, 234, 237, 0.6);
  --color-text-muted: rgba(232, 234, 237, 0.35);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

* {
  box-sizing: border-box;
}

body {
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
}

@keyframes float-particle {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  10% { opacity: 0.04; }
  90% { opacity: 0.04; }
  100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
}
```

### 2. Root layout

**File: `src/app/layout.tsx`** (already scaffolded)

Update to pass `h-full` to html/body and include the Geist mono font variable:

```tsx
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg-base text-text-primary font-sans">{children}</body>
    </html>
  );
}
```

### 3. Type definitions

**File: `src/types/sim.ts`**

```ts
export interface SimState {
  tick: number;
  running: boolean;
  speed: number;
  intervalId: ReturnType<typeof setInterval> | null;
  processes: Process[];
  history: HistoryEntry[];
  memory: MemoryState;
  disk: DiskState;
  terminal: TerminalState;
  stats: SimStats;
}

// Stub types — expanded in later phases
export interface Process {}
export interface HistoryEntry {}
export interface MemoryState {}
export interface DiskState {}
export interface TerminalState {}
export interface SimStats {}
```

### 4. Sim engine entry point & tick loop

**File: `src/lib/sim.ts`**

Pure functions — no React imports:

```ts
import type { SimState } from "@/types/sim";

export function createInitialState(): SimState {
  return {
    tick: 0,
    running: false,
    speed: 500,
    intervalId: null,
    processes: [],
    history: [],
    memory: { frames: [] },
    disk: { blocks: [], inodes: [] },
    terminal: { output: [], history: [], historyIndex: -1 },
    stats: { contextSwitches: 0, pageFaults: 0, cpuUtil: [] },
  };
}

export function tick(state: SimState): SimState {
  return {
    ...state,
    tick: state.tick + 1,
  };
}
```

### 5. Custom hook: `useSimulation`

**File: `src/hooks/useSimulation.ts`**

```ts
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { SimState } from "@/types/sim";
import { createInitialState, tick } from "@/lib/sim";

export function useSimulation() {
  const [state, setState] = useState<SimState>(createInitialState());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doTick = useCallback(() => {
    setState(prev => tick(prev));
  }, []);

  const start = useCallback(() => {
    setState(prev => {
      if (prev.running) return prev;
      return { ...prev, running: true };
    });
  }, []);

  const stop = useCallback(() => {
    setState(prev => {
      if (!prev.running) return prev;
      return { ...prev, running: false };
    });
  }, []);

  const setSpeed = useCallback((ms: number) => {
    setState(prev => ({ ...prev, speed: Math.max(50, Math.min(2000, ms)) }));
  }, []);

  // Manage the interval
  useEffect(() => {
    if (state.running) {
      intervalRef.current = setInterval(doTick, state.speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.running, state.speed, doTick]);

  return { state, start, stop, setSpeed };
}
```

### 6. Dashboard grid layout

**File: `src/components/dashboard/DashboardGrid.tsx`**

```tsx
"use client";

import { useSimulation } from "@/hooks/useSimulation";
import Header from "./Header";
import SimulationControls from "./SimulationControls";
import SchedulerPanel from "../panels/SchedulerPanel";
import MemoryPanel from "../panels/MemoryPanel";
import FilesystemPanel from "../panels/FilesystemPanel";
import TerminalPanel from "../panels/TerminalPanel";

export default function DashboardGrid() {
  const { state, start, stop, setSpeed } = useSimulation();

  return (
    <div className="min-h-screen p-4 flex flex-col gap-4">
      <Header tick={state.tick} />
      <SimulationControls
        running={state.running}
        speed={state.speed}
        onStart={start}
        onStop={stop}
        onSpeedChange={setSpeed}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        <SchedulerPanel />
        <MemoryPanel />
        <FilesystemPanel />
        <TerminalPanel />
      </div>
    </div>
  );
}
```

### 7. Header component

**File: `src/components/dashboard/Header.tsx`**

```tsx
export default function Header({ tick }: { tick: number }) {
  return (
    <header className="flex items-center justify-between px-2">
      <h1 className="text-xl font-semibold tracking-tight">Kernel Visualizer</h1>
      <span className="font-mono text-sm text-text-secondary">
        tick: <span className="text-text-primary">{tick}</span>
      </span>
    </header>
  );
}
```

### 8. SimulationControls component

**File: `src/components/dashboard/SimulationControls.tsx`**

```tsx
"use client";

interface Props {
  running: boolean;
  speed: number;
  onStart: () => void;
  onStop: () => void;
  onSpeedChange: (ms: number) => void;
}

export default function SimulationControls({ running, speed, onStart, onStop, onSpeedChange }: Props) {
  return (
    <div className="flex items-center gap-4 px-2">
      <button
        onClick={running ? onStop : onStart}
        className="px-4 py-1.5 text-sm rounded-lg bg-white/6 border border-white/10 hover:bg-white/10 transition-colors"
      >
        {running ? "⏸ Pause" : "▶ Play"}
      </button>
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        Speed
        <input
          type="range"
          min={50}
          max={2000}
          value={speed}
          onChange={e => onSpeedChange(Number(e.target.value))}
          className="w-24 accent-cyan-400"
        />
        <span className="font-mono text-xs text-text-muted w-12">{speed}ms</span>
      </label>
    </div>
  );
}
```

### 9. Placeholder panel components

Create four stub panels:

**`src/components/panels/SchedulerPanel.tsx`**: returns a `<section>` with cyan accent border and `<h2>Scheduler</h2>`.

**`src/components/panels/MemoryPanel.tsx`**: magenta accent, `<h2>Memory</h2>`.

**`src/components/panels/FilesystemPanel.tsx`**: amber accent, `<h2>Filesystem</h2>`.

**`src/components/panels/TerminalPanel.tsx`**: green accent, `<h2>Terminal</h2>`.

Each panel uses the glassmorphic styling:
```tsx
<section className="rounded-xl bg-white/3 backdrop-blur-xl border border-white/6 p-5
  [border-color:var(--color-accent-scheduler)]/30
  hover:[border-color:var(--color-accent-scheduler)]/60 transition-colors">
  <h2 className="text-xs uppercase tracking-[0.12em] text-text-muted mb-3">Scheduler</h2>
  <div className="text-text-secondary text-sm">Pending…</div>
</section>
```

### 10. Update `page.tsx`

**File: `src/app/page.tsx`**

```tsx
import DashboardGrid from "@/components/dashboard/DashboardGrid";

export default function Home() {
  return <DashboardGrid />;
}
```

## Acceptance Criteria
- [x] `bun dev` starts without errors
- [x] Browser shows four glassmorphic panels in a 2×2 grid on dark background
- [x] Panels have distinct neon-tinted borders (cyan, magenta, amber, green)
- [x] Header shows "Kernel Visualizer" title and `tick: 0`
- [x] Play button starts the tick counter incrementing; Pause freezes it
- [x] Speed slider changes tick rate in real time
- [x] No React/Next.js warnings in console

## Files Touched
- `src/app/globals.css` — theme tokens, animations
- `src/app/layout.tsx` — body classes
- `src/app/page.tsx` — mounts DashboardGrid
- `src/types/sim.ts` — SimState interface
- `src/lib/sim.ts` — createInitialState, tick
- `src/hooks/useSimulation.ts` — custom hook
- `src/components/dashboard/DashboardGrid.tsx` — grid layout
- `src/components/dashboard/Header.tsx` — title + tick
- `src/components/dashboard/SimulationControls.tsx` — play/pause/speed
- `src/components/panels/SchedulerPanel.tsx` — stub
- `src/components/panels/MemoryPanel.tsx` — stub
- `src/components/panels/FilesystemPanel.tsx` — stub
- `src/components/panels/TerminalPanel.tsx` — stub
