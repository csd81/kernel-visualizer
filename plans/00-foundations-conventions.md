# Phase 0 — Foundations & Development Conventions

## Goal
Establish the tech stack, project structure, coding conventions, component architecture, and state management strategy that every subsequent phase builds upon.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Runtime** | Bun 1.3 | Fast package manager, dev server, script runner |
| **Framework** | Next.js 16.2 (App Router) | File-based routing, React 19, SSR optional |
| **Language** | TypeScript 5.9 (strict) | Type safety across simulation engine and UI |
| **UI Library** | React 19 | Component model for the dashboard panels |
| **Styling** | Tailwind CSS 4 | Utility-first, dark theme, `@theme` tokens |
| **Linting** | ESLint 9 + `eslint-config-next` | Inline config, no Prettier needed |

**No additional dependencies.** No Redux, no Zustand, no Framer Motion, no chart library. The simulation is pure TS; charts are hand-drawn SVG; animations are CSS transitions/keyframes.

---

## Project Structure

```
kernel-visualizer/
├── plans/                        # Phase markdown files
├── public/                       # Static assets (icons, SVGs)
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── globals.css           # Tailwind + design tokens
│   │   ├── layout.tsx            # Root layout (html, body, fonts)
│   │   └── page.tsx              # Home page — mounts the dashboard
│   ├── components/               # React components
│   │   ├── panels/               # Four main dashboard panels
│   │   │   ├── SchedulerPanel.tsx
│   │   │   ├── MemoryPanel.tsx
│   │   │   ├── FilesystemPanel.tsx
│   │   │   └── TerminalPanel.tsx
│   │   ├── dashboard/            # Dashboard grid, header, controls
│   │   │   ├── DashboardGrid.tsx
│   │   │   ├── Header.tsx
│   │   │   └── SimulationControls.tsx
│   │   ├── scheduler/            # Process card, queue lanes, Gantt
│   │   │   ├── ProcessCard.tsx
│   │   │   ├── QueueLane.tsx
│   │   │   └── GanttChart.tsx
│   │   ├── memory/               # Frame grid, detail panel
│   │   │   ├── FrameGrid.tsx
│   │   │   └── FrameDetail.tsx
│   │   ├── filesystem/           # Block grid, inode table
│   │   │   ├── BlockGrid.tsx
│   │   │   └── InodeTable.tsx
│   │   └── terminal/             # Terminal output, input line
│   │       └── Terminal.tsx
│   ├── lib/                      # Pure TS simulation engine (NO React)
│   │   ├── sim.ts                # Simulation state, tick loop
│   │   ├── scheduler.ts          # FCFS, RR, Priority, MLFQ
│   │   ├── process.ts            # Process class, process table
│   │   ├── memory.ts             # Memory manager, frame allocation
│   │   ├── filesystem.ts         # VFS, INode, disk block management
│   │   ├── terminal.ts           # Command parser, shell logic
│   │   ├── history.ts            # Context switch log, stats tracking
│   │   └── colors.ts             # Process color palette, block colors
│   └── types/                    # Shared TypeScript types
│       ├── sim.ts                # Simulation state types
│       ├── process.ts            # Process, PCB types
│       ├── memory.ts             # Frame, PageTable types
│       ├── filesystem.ts         # INode, DiskBlock types
│       └── terminal.ts           # Command, OutputLine types
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
└── bun.lock
```

### Rule: Pure Sim Engine

Files in `src/lib/` MUST NOT import anything from React, Next.js, or `src/components/`. They are pure TypeScript modules that receive input and return output. This keeps the simulation testable and portable.

Files in `src/components/` MAY import from `src/lib/` and `src/types/`.

### Rule: One Thing Per File

Each file exports one primary thing (a class, a function, or a React component). Utility helpers shared across files live in a single `src/lib/utils.ts`.

---

## Component Architecture

```
<DashboardGrid>
├── <Header tick={tick} />
├── <SimulationControls onPause onResume onSpeed />
├── <SchedulerPanel>
│   ├── <QueueLane label="READY" processes={...} />
│   ├── <QueueLane label="RUNNING" processes={...} />
│   └── <GanttChart history={history} />
├── <MemoryPanel>
│   ├── <FrameGrid frames={frames} onSelect={...} />
│   └── <FrameDetail selected={selectedFrame} />
├── <FilesystemPanel>
│   ├── <BlockGrid blocks={blocks} />
│   └── <InodeTable inodes={inodes} />
└── <TerminalPanel>
    └── <Terminal onCommand={...} output={lines} />
```

**Data flow**: `DashboardGrid` owns the simulation state via a custom hook (`useSimulation`). It passes slices of state down as props. Commands from `<Terminal>` call action functions on the simulation engine, which update state, which re-render via React.

---

## State Management

Central simulation state lives in a single `SimState` object managed by a custom hook:

```ts
// src/lib/sim.ts
export interface SimState {
  tick: number;
  running: boolean;
  speed: number;
  processes: Process[];
  history: HistoryEntry[];
  memory: MemoryState;
  disk: DiskState;
  terminal: TerminalState;
  stats: SimStats;
}

export function createInitialState(): SimState { ... }
export function tick(state: SimState): SimState { ... }
```

**The tick function is a pure reducer**: `(state) => newState`. No side effects, no mutations. React reconciles the UI.

```ts
// src/hooks/useSimulation.ts (custom hook)
function useSimulation() {
  const [state, setState] = useState<SimState>(createInitialState());
  const intervalRef = useRef<number | null>(null);

  const doTick = useCallback(() => {
    setState(prev => tick(prev));
  }, []);

  // start/stop interval based on state.running
  ...
}
```

This avoids the complexity of `useReducer` while keeping state updates predictable. For performance, use `useMemo` and `React.memo` on expensive sub-trees.

---

## Styling Conventions

**Design System**: Dark glassmorphic theme with neon subsystem accents.

### CSS Variables (`globals.css`)

```css
@theme inline {
  --color-bg-base: #0b0e14;
  --color-bg-panel: rgba(255, 255, 255, 0.03);
  --color-border-panel: rgba(255, 255, 255, 0.06);
  --color-accent-scheduler: #00e5ff;
  --color-accent-memory: #d500f9;
  --color-accent-filesystem: #ffab00;
  --color-accent-terminal: #33ff33;
  --color-text-primary: #e8eaed;
  --color-text-secondary: rgba(232, 234, 237, 0.6);
  --color-text-muted: rgba(232, 234, 237, 0.35);
}
```

### Component Styling Rules
- Use Tailwind utility classes for layout, spacing, typography
- Use inline `style` props or CSS modules for dynamic values (process colors, frame colors)
- Animations go in `globals.css` as `@keyframes`
- Glassmorphism pattern: `bg-white/3 backdrop-blur-xl border border-white/6 rounded-xl`

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| TS files (lib/) | kebab-case | `memory-allocation.ts` |
| React components | PascalCase | `ProcessCard.tsx` |
| Type/interface files | kebab-case | `sim.ts`, `process.ts` |
| Exported types | PascalCase | `SimState`, `Process` |
| Functions | camelCase | `allocateFrames()`, `scheduleNext()` |
| CSS classes | Tailwind utility | `class="flex gap-2"` |
| CSS animations | kebab-case | `@keyframes pulse-glow` |
| CSS variables | `--kebab-case` | `--color-accent-scheduler` |

---

## Phase Plan Format

Every phase plan from 1–20 follows this exact structure:

```md
# Phase N — Title

## Goal
One-sentence summary of what this phase delivers.

## Prerequisites
Which phases must be complete before starting.

## Tasks
Numbered list of concrete implementation steps.

### [Task 1 Title]
Implementation details, code sketches, key decisions.

### [Task 2 Title]
...

## Acceptance Criteria
Checklist of observable behaviours that confirm the phase is done.

## Files Touched
List of files created or modified (relative to src/).
```

---

## Git Workflow

```
main ← feature/ph-N-title  (one branch per phase)
```

- Each phase is developed on its own branch: `feature/ph-01-project-skeleton`
- Merge to `main` only when acceptance criteria are met
- Commits follow conventional intent: `"feat: ..."`, `"fix: ..."`, `"refactor: ..."`

---

## Dev Commands

```sh
bun dev          # Start Next.js dev server (port 3000)
bun run build    # Production build
bun run lint     # ESLint check
bunx tsc --noEmit # Type check
```
