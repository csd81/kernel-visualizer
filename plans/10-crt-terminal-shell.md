# Phase 10 — CRT Terminal Shell

## Goal
Build the interactive terminal panel: green-on-black CRT aesthetic, scan-line overlay, blinking cursor, command history, styled output.

## Prerequisites
- Phase 1 (panel infrastructure)

## Tasks

### 1. Terminal types
**Status: DONE** — `src/types/terminal.ts` defines `OutputLine` (id, text, type) and `TerminalState` (output, history, historyIndex). Matches plan exactly.

### 2. Terminal command dispatcher
**Status: DONE** — `addLine()` and `parseCommand()` exist in `src/lib/terminal-parser.ts`. `processShellCommand()` lives in `src/lib/terminal.ts` and routes parsed commands to the appropriate subsystem functions.

### 3. Terminal React component
**Status: DONE** — `src/components/terminal/Terminal.tsx` has green-on-black styling, scan-line overlay via `repeating-linear-gradient`, auto-scroll to bottom, `ArrowUp`/`ArrowDown` history navigation, `Enter` to submit, and a blinking green caret. Uses local `localHistoryIdx` for history navigation rather than the plan's prop-based approach (cleaner, less prop drilling).

### 4. TerminalPanel integration
**Status: DONE** — `src/components/panels/TerminalPanel.tsx` wraps `Terminal`, passing `output`, `history`, and `onCommand` from `useSimulation`. Uses `row-span-1 lg:row-span-2` for the taller layout in the 2-column grid.

### 5. CRT glow effect
**Status: DONE** — `.crt-glow` class in `globals.css` adds `box-shadow: inset 0 0 60px rgba(0, 255, 0, 0.03)`. Applied to the terminal's inner container.

## Acceptance Criteria
- [x] Terminal looks like a retro CRT: black background, green text, scan lines
- [x] Typing input and pressing Enter echoes with `$ ` prefix
- [x] ArrowUp cycles through command history
- [x] ArrowDown returns to blank input
- [x] Output auto-scrolls to bottom
- [x] Unknown command shows error-style message
- [x] `clear` command clears the terminal
- [x] Responsive sizing: smaller text on mobile, larger on desktop

## Files Touched
- `src/types/terminal.ts` — OutputLine, TerminalState ✅
- `src/lib/terminal-parser.ts` — addLine, parseCommand ✅
- `src/lib/terminal.ts` — processShellCommand ✅
- `src/components/terminal/Terminal.tsx` — full terminal component ✅
- `src/components/panels/TerminalPanel.tsx` — wire terminal ✅
- `src/app/globals.css` — crt-glow ✅
