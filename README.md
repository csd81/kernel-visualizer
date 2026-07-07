# Kernel Visualizer

An interactive web-based operating system kernel simulator. Watch CPU scheduling, memory allocation, and filesystem operations in real time through a glassmorphic dashboard — all running in your browser.

Built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS 4**, and **Bun**.

## Features

### CPU Scheduler
- **Algorithms**: FCFS, Round Robin (configurable quantum), Priority, MLFQ (Multi-Level Feedback Queue)
- **Visual**: Animated process cards moving between queue lanes (READY / RUNNING / BLOCKED)
- **Gantt chart** timeline showing process execution history
- **Priority aging** — starved processes get boosted
- **Deadlock detection** — cycle detection in the wait-for graph

### Memory Manager
- 256 physical frames arranged in a 16×16 grid (1 KB per frame)
- **Allocation algorithms**: First Fit, Best Fit
- Click any frame to inspect page table entries and allocation details
- **Page fault simulation** — trigger faults and watch processes block/unblock
- Fragmentation % tracking with color-coded warnings

### Virtual File System
- 128 disk blocks (512 B/block) with boot sector, superblock, inode tables, and data blocks
- File creation and deletion with **fragmented allocation**
- Fragmentation percentage with real-time bar visualization
- Hover to highlight which blocks belong to which file

### Interactive Terminal
- CRT-styled terminal with scan-line overlay and green-on-black display
- Full command set: `fork`, `kill`, `alloc`, `free`, `create`, `rm`, `ls`, `df`, `ps`, `speed`, `pause`, `resume`, `clear`, `help`
- Command history (arrow up/down)
- Styled output: green for success, red for errors, yellow for warnings

### Cross-Subsystem Integration
- `fork` auto-reserves memory frames
- `kill` cleans up memory and file handles
- Memory pressure blocks processes, auto-retry on ticks
- Page faults trigger process blocking with auto-resolution

## Getting Started

```sh
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000). Type `help` in the terminal to see all commands.

### Commands

| Command | Description |
|---|---|
| `fork <ticks> <priority>` | Create a new process |
| `kill <pid>` | Terminate a process |
| `ps` | List processes |
| `alloc <pid> <size_kb>` | Allocate memory frames |
| `free <pid>` | Free all memory for a PID |
| `pfault <pid> <page>` | Simulate a page fault |
| `create <name> <blocks>` | Create a file |
| `rm <name>` | Delete a file |
| `ls` | List files |
| `df` | Disk usage |
| `speed <ms>` | Set tick speed (50–2000ms) |
| `pause` / `resume` | Control simulation |
| `clear` | Clear terminal |

### Presets

Load preset scenarios from the dropdown in the toolbar:
- **CPU Demo** — 6 processes with RR scheduling
- **Memory Pressure** — 80% memory allocated
- **Disk Frag** — fragmented filesystem
- **Deadlock** — two-process deadlock cycle

## Project Structure

```
src/
├── lib/          # Pure TypeScript simulation engine (no React)
│   ├── sim.ts           # Core state, tick loop
│   ├── scheduler.ts     # Scheduling algorithms
│   ├── memory.ts        # Frame allocation
│   ├── filesystem.ts    # Inode/block management
│   ├── terminal.ts      # Command dispatcher
│   ├── deadlock.ts      # Cycle detection
│   └── presets.ts       # Save/load presets
├── types/        # TypeScript interfaces
├── hooks/        # React hooks + context
└── components/   # React components
    ├── dashboard/       # Grid, header, controls
    ├── panels/          # Scheduler, Memory, Filesystem, Terminal
    ├── scheduler/       # ProcessCard, GanttChart, QueueLane, etc.
    ├── memory/          # FrameGrid, FrameDetail
    ├── filesystem/      # BlockGrid, InodeTable
    ├── terminal/        # CRT terminal
    └── shared/          # Sparkline, StatTile, ErrorBoundary
```

The simulation engine in `src/lib/` is pure TypeScript with zero React imports — making it testable and independent of the UI layer.

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Pause / Resume |
| `+` / `-` | Increase / Decrease speed |

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Bun 1.3 |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| UI | React 19 |
| Styling | Tailwind CSS 4 |
| Linting | ESLint 9 |

## Development

```sh
bun run build     # Production build + type check
bun run lint      # ESLint
bunx tsc --noEmit # TypeScript check only
```

## License

MIT
