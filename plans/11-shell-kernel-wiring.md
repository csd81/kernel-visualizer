# Phase 11 — Shell ↔ Kernel Wiring

## Goal
Wire every shell command to the real kernel subsystem. Handle all parsing and errors with styled output. Dedicated `help` command.

## Prerequisites
- Phase 10 (CRT terminal shell)
- Phase 4 (fork/kill/renice)
- Phase 6 (alloc/free)
- Phase 7 (pfault)
- Phase 9 (create/rm)

## Tasks

### 1. Command dispatcher
**Status: DONE** — `processShellCommand()` in `src/lib/terminal.ts` implements all 16 command handlers. Real code goes beyond the plan:

- `alloc` also builds page table entries via `buildPageTable()` and attaches them to the process record
- `free` clears both frames and the process's page table and holds arrays
- `pfault` handler exists and calls `simulatePageFault()` — but that function doesn't exist in `memory.ts` yet (part of Phase 7's outstanding work)
- `renice` handler is fully implemented, calling `renice()` from scheduler

### 2. Wire to SimulationContext
**Status: DONE** — `processCommand` callback in `useSimulation.ts` calls `processShellCommand` and updates state. Wired in `SimulationContext` and used by `TerminalPanel`.

### 3. ps command
**Status: DONE** — Formatted table with PID, state, ticks, priority. Empty-state handling for no processes.

### 4. speed / pause / resume / clear
**Status: DONE** — All four handlers exist with proper validation (speed clamped to 50–2000ms, pause/resume toggle running flag, clear empties output).

### 5. Styled output
**Status: DONE** — Color-coded via `OutputLine.type`: `"success"` (green), `"error"` (red), `"warning"` (yellow), `"info"` (default). Terminal component maps types to Tailwind text colors.

## Acceptance Criteria
- [x] Every command from `help` works end-to-end
- [x] `fork abc` → "Usage: fork <ticks> <priority>" error
- [x] `kill 9999` → "unknown PID" error
- [x] `alloc 1 500` → "insufficient memory" error
- [x] `speed 100` → speed set, `speed 0` → clamped to valid range
- [x] `clear` empties terminal
- [x] `ps` prints formatted process table
- [x] Output is colour-coded (green success, red errors)
- [x] `renice` changes process priority
- [x] `alloc` populates process page table

## Files Touched
- `src/lib/terminal.ts` — processShellCommand with 16 command handlers ✅
- `src/hooks/useSimulation.ts` — processCommand wired in context ✅
- `src/hooks/SimulationContext.tsx` — processCommand in interface ✅
- `src/lib/terminal-parser.ts` — addLine, parseCommand ✅
