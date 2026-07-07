# Phase 11 — Shell ↔ Kernel Wiring

## Goal
Wire every shell command to the real kernel subsystem. Handle all parsing and errors with styled output. Dedicated `help` command.

## Prerequisites
- Phase 10 (CRT terminal shell)
- Phase 4 (fork/kill)
- Phase 6 (alloc/free)
- Phase 7 (pfault)
- Phase 9 (create/rm)

## Tasks

### 1. Command dispatcher

**File: `src/lib/terminal.ts` — `processCommand`**

Pure function that takes current state + input and returns new state + message:

```ts
import type { SimState } from "@/types/sim";
import type { OutputLine } from "@/types/terminal";
import { fork, kill, renice } from "@/lib/scheduler";
import { allocateFrames, freeProcessFrames, simulatePageFault } from "@/lib/memory";
import { createFile, deleteFile, ls, df } from "@/lib/filesystem";
import { addLine } from "./terminal";

export function processShellCommand(state: SimState, input: string): SimState {
  const { cmd, args } = parseCommand(input);
  let output = addLine(state.terminal.output, input, "input");
  let next = { ...state, terminal: { ...state.terminal, output } };

  switch (cmd) {
    case "help": {
      const helpText = [
        "Available commands:",
        "  fork <ticks> <priority>   — Create a process",
        "  kill <pid>                — Terminate a process",
        "  renice <pid> <pri>        — Change process priority",
        "  ps                        — List processes",
        "  alloc <pid> <size_kb>     — Allocate memory frames",
        "  free <pid>                — Free all memory for PID",
        "  pfault <pid> <page>       — Simulate a page fault",
        "  create <name> <blocks>    — Create a file on disk",
        "  rm <name>                 — Delete a file",
        "  ls                        — List files",
        "  df                        — Disk usage / inodes",
        "  speed <ms>                — Set tick speed (50–2000ms)",
        "  pause                     — Pause simulation",
        "  resume                    — Resume simulation",
        "  clear                     — Clear terminal",
        "  help                      — Show this message",
      ].join("\n");
      output = addLine(output, helpText, "info");
      return { ...next, terminal: { ...next.terminal, output } };
    }

    case "fork": {
      const ticks = parseInt(args[0]);
      const priority = parseInt(args[1]);
      if (isNaN(ticks) || isNaN(priority))
        return { ...next, terminal: { ...next.terminal, output: addLine(output, "Usage: fork <ticks> <priority>", "error") } };
      const result = fork(next, ticks, priority);
      output = addLine(output, result.message, result.message.startsWith("Created") ? "success" : "error");
      return { ...result.state, terminal: { ...result.state.terminal, output } };
    }

    case "kill": {
      const pid = parseInt(args[0]);
      if (isNaN(pid)) return { ...next, terminal: { ...next.terminal, output: addLine(output, "Usage: kill <pid>", "error") } };
      const result = kill(next, pid);
      output = addLine(output, result.message, result.message.includes("terminated") ? "success" : "error");
      return { ...result.state, terminal: { ...result.state.terminal, output } };
    }

    case "alloc": {
      const pid = parseInt(args[0]), size = parseInt(args[1]);
      if (isNaN(pid) || isNaN(size)) return { ...next, terminal: { ...next.terminal, output: addLine(output, "Usage: alloc <pid> <size_kb>", "error") } };
      const result = allocateFrames(next.memory, pid, size);
      if (result.message) {
        output = addLine(output, result.message, "error");
      } else {
        output = addLine(output, `Allocated ${size} KB to PID ${pid} (frames ${result.allocated[0]}–${result.allocated[result.allocated.length-1]})`, "success");
      }
      return { ...next, memory: result.memory, terminal: { ...next.terminal, output } };
    }

    // … implement case branches for free, pfault, create, rm, ls, df, ps, speed, pause, resume, clear, renice …

    default:
      output = addLine(output, `Unknown command: '${cmd}'. Type 'help' for available commands.`, "error");
      return { ...next, terminal: { ...next.terminal, output } };
  }
}
```

### 2. Wire to SimulationContext

Add `processCommand(input: string)` that calls `processShellCommand(state, input)` and sets the new state via `setState`.

### 3. ps command

```ts
case "ps": {
  if (state.processes.length === 0) {
    output = addLine(output, "No processes.", "info");
  } else {
    const rows = state.processes.map(p =>
      `PID ${String(p.pid).padEnd(4)} ${p.state.padEnd(10)} ${p.remainingTicks}/${p.totalTicks} ticks  pri ${p.priority}`
    );
    output = addLine(output, `PID   STATE      TICKS   PRI\n${rows.join("\n")}`, "info");
  }
  break;
}
```

### 4. speed / pause / resume

```ts
case "speed": {
  const ms = parseInt(args[0]);
  if (isNaN(ms) || ms < 50 || ms > 2000)
    return { ...next, terminal: { ...next.terminal, output: addLine(output, "Speed must be 50–2000ms", "error") } };
  output = addLine(output, `Speed set to ${ms}ms per tick`, "success");
  return { ...next, speed: ms, terminal: { ...next.terminal, output } };
}
case "pause":
  output = addLine(output, "⏸ Paused", "warning");
  return { ...next, running: false, terminal: { ...next.terminal, output } };
case "resume":
  output = addLine(output, "▶ Resumed", "success");
  return { ...next, running: true, terminal: { ...next.terminal, output } };
case "clear":
  return { ...next, terminal: { ...next.terminal, output: [] } };
```

### 5. Styled output

Each command result is color-coded:
- `"success"` — green for positive outcomes
- `"error"` — red for errors
- `"warning"` — yellow for warnings (pause, low resources)
- `"info"` — default info/table output

## Acceptance Criteria
- [ ] Every command from `help` works end-to-end
- [ ] `fork abc` → "Usage: fork <ticks> <priority>" error
- [ ] `kill 9999` → "unknown PID" error
- [ ] `alloc 1 500` → "insufficient memory" error
- [ ] `speed 100` → speed set, `speed 0` → clamped to valid range
- [ ] `clear` empties terminal
- [ ] `ps` prints formatted process table
- [ ] Output is colour-coded (green success, red errors)

## Files Touched
- `src/lib/terminal.ts` — processShellCommand
- `src/hooks/SimulationContext.tsx` — add processCommand to context
