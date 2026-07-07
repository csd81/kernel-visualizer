# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
bun dev          # Start Next.js dev server (port 3000)
bun run build    # Production build with type checking
bun run lint     # ESLint check
bunx tsc --noEmit # TypeScript check only
```

## Architecture

### Core principle: pure sim engine separated from React

The simulation engine lives in `src/lib/` — pure TypeScript with zero React imports. This keeps it testable and portable.

```
src/lib/           # Pure TS — NO React imports allowed
  sim.ts           # SimState type, createInitialState(), tick()
  scheduler.ts     # FCFS scheduler, createProcess(), fork(), kill()
  memory.ts        # Frame allocation (first-fit, best-fit), page faults
  filesystem.ts    # Inode/block management, create/delete files
  terminal.ts      # processShellCommand() — routes CLI input to engines
  terminal-parser.ts # addLine(), parseCommand()
  colors.ts        # processColor(), blockColor()
  deadlock.ts      # Wait-for graph cycle detection
  presets.ts       # exportState(), importState(), loadPreset()

src/types/         # Shared TS interfaces
  sim.ts           # SimState, SimStats, HistoryEntry, SchedAlgorithm
  process.ts       # Process, ProcessState, PageTableEntry
  memory.ts        # Frame, MemoryState
  filesystem.ts    # DiskBlock, INode, DiskState
  terminal.ts      # OutputLine, TerminalState
```

### State management pattern

**Immutable state, single source of truth.** `SimState` is the entire app state. It's never mutated — every tick produces a new object via spread operators.

```
useSimulation hook (src/hooks/useSimulation.ts)
  ├── useState<SimState>(createInitialState)
  ├── setInterval → tick()        # Pure reducer: (state) => newState
  ├── SimulationContext.Provider   # Distributes state + actions to all panels
  └── Actions: start, stop, setSpeed, setScheduler, setQuantum,
              setMemAlgorithm, processCommand, loadPreset, resetSim, downloadState
```

Tick flow: `interval → tick() → scheduleFcfs()/etc → stats update → deadlock detection → setState → React re-render`

### Component tree

```
page.tsx
  └── SimulationProvider
      └── DashboardGrid
          ├── Header (tick counter)
          ├── SimulationControls (play/pause, speed slider, preset loader, save/reset)
          ├── DeadlockBanner (conditionally shown)
          ├── SchedulerPanel
          │   ├── AlgorithmSelector
          │   ├── QueueLane (RUNNING)
          │   ├── QueueLane (READY)
          │   ├── QueueLane (BLOCKED)
          │   ├── StatTile (CPU, CTX, Ticks)
          │   ├── ProcessTable (collapsible)
          │   └── GanttChart (collapsible)
          ├── MemoryPanel
          │   ├── Algorithm selector (First/Best Fit)
          │   ├── StatTile (Used, Frag)
          │   ├── FrameGrid (16×16)
          │   └── FrameDetail
          ├── FilesystemPanel
          │   ├── StatTile (Blocks, Frag, Files)
          │   ├── BlockGrid (128 blocks)
          │   └── InodeTable
          └── TerminalPanel
              └── Terminal (CRT-themed, scanlines, command history)
```

### Key patterns

- **Panels use `useSimulation()` from `SimulationContext`** — they read state, never write it directly. Actions are called through the context.
- **All sim engines are pure functions** — `(state, args) => { state, message }`. No side effects, no class instances.
- **Commands flow: Terminal → processShellCommand → engine functions → new state → re-render**
- **React.memo** on grid components (`FrameGrid`, `BlockGrid`, `ProcessTable`) to skip re-renders when immutable references haven't changed.
- **`"use client"`** at the top of every interactive component — this is a Next.js App Router project with no server components in the dashboard.

### Styling

Tailwind CSS v4 with `@theme` tokens in `globals.css`. All colors, animations, and glassmorphic effects are defined there. No CSS modules. No styled-components.

### Tech stack

Bun runtime, Next.js 16 App Router, React 19, TypeScript 5 (strict), Tailwind CSS v4, ESLint. No external state management, no chart libraries, no animation libraries.
