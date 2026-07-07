# Phase 10 — CRT Terminal Shell

## Goal
Build the interactive terminal panel: green-on-black CRT aesthetic, scan-line overlay, blinking cursor, command history, styled output.

## Prerequisites
- Phase 1 (panel infrastructure)

## Tasks

### 1. Terminal types

**File: `src/types/terminal.ts`**

```ts
export interface OutputLine {
  id: number;
  text: string;
  type: "input" | "output" | "info" | "success" | "error" | "warning";
}

export interface TerminalState {
  output: OutputLine[];
  history: string[];
  historyIndex: number;
}
```

### 2. Terminal command dispatcher

**File: `src/lib/terminal.ts`**

```ts
import type { OutputLine } from "@/types/terminal";

let nextLineId = 1;

export function addLine(output: OutputLine[], text: string, type: OutputLine["type"] = "info"): OutputLine[] {
  return [...output, { id: nextLineId++, text, type }];
}

export function parseCommand(input: string): { cmd: string; args: string[] } {
  const parts = input.trim().split(/\s+/);
  return { cmd: parts[0]?.toLowerCase() || "", args: parts.slice(1) };
}
```

### 3. Terminal React component

**File: `src/components/terminal/Terminal.tsx`**

```tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { OutputLine } from "@/types/terminal";
import { addLine, parseCommand } from "@/lib/terminal";

interface Props {
  output: OutputLine[];
  history: string[];
  historyIndex: number;
  onCommand: (input: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  input: "text-text-primary",
  output: "text-text-primary",
  info: "text-text-secondary",
  success: "text-green-400",
  error: "text-red-400",
  warning: "text-yellow-400",
};

export default function Terminal({ output, history, historyIndex: _hi, onCommand }: Props) {
  const [input, setInput] = useState("");
  const [localHistoryIndex, setLocalHistoryIndex] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      onCommand(input.trim());
      setInput("");
      setLocalHistoryIndex(-1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = Math.min(localHistoryIndex + 1, history.length - 1);
      if (idx >= 0) {
        setInput(history[history.length - 1 - idx]);
        setLocalHistoryIndex(idx);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (localHistoryIndex > 0) {
        const idx = localHistoryIndex - 1;
        setInput(history[history.length - 1 - idx]);
        setLocalHistoryIndex(idx);
      } else {
        setInput("");
        setLocalHistoryIndex(-1);
      }
    }
  }, [input, onCommand, history, localHistoryIndex]);

  return (
    <div
      className="h-full flex flex-col font-mono text-sm bg-black rounded-lg overflow-hidden cursor-text"
      style={{ caretColor: "#33ff33" }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Scan-line overlay */}
      <div className="relative flex-1 flex flex-col">
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)" }}
        />
        <div
          ref={outputRef}
          className="flex-1 overflow-y-auto p-3 space-y-0.5 relative z-0"
        >
          {output.map(line => (
            <div key={line.id} className={`${TYPE_COLORS[line.type]} whitespace-pre-wrap break-all`}>
              {line.type === "input" ? <span className="text-green-400">$ </span> : ""}
              {line.text}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 p-2 border-t border-white/10">
          <span className="text-green-400 shrink-0">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-green-400 text-sm"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
```

### 4. TerminalPanel integration

**File: `src/components/panels/TerminalPanel.tsx`**

```tsx
"use client";

import Terminal from "../terminal/Terminal";
import { useSimulation } from "@/hooks/SimulationContext";

export default function TerminalPanel() {
  const { state, processCommand } = useSimulation();

  return (
    <section className="rounded-xl bg-white/3 backdrop-blur-xl border border-white/6 p-5
      [border-color:var(--color-accent-terminal)]/30
      hover:[border-color:var(--color-accent-terminal)]/60 transition-colors row-span-1 lg:row-span-2 flex flex-col">
      <h2 className="text-xs uppercase tracking-[0.12em] text-text-muted mb-3">Terminal</h2>
      <div className="flex-1 min-h-0">
        <Terminal
          output={state.terminal.output}
          history={state.terminal.history}
          historyIndex={state.terminal.historyIndex}
          onCommand={processCommand}
        />
      </div>
    </section>
  );
}
```

Set `row-span-1 lg:row-span-2` so the terminal panel is taller in the 2-column grid.

### 5. CRT glow effect

Add inner shadow to terminal:

```css
/* Add to globals.css */
.crt-glow {
  box-shadow: inset 0 0 60px rgba(0, 255, 0, 0.03);
}
```

Apply via `className="... crt-glow"`.

## Acceptance Criteria
- [ ] Terminal looks like a retro CRT: black background, green text, scan lines
- [ ] Typing input and pressing Enter echoes with `$ ` prefix
- [ ] ArrowUp cycles through command history
- [ ] Output auto-scrolls to bottom
- [ ] Unknown command shows error-style message
- [ ] Clear terminal with button or `clear` command

## Files Touched
- `src/types/terminal.ts` — OutputLine, TerminalState
- `src/lib/terminal.ts` — addLine, parseCommand
- `src/components/terminal/Terminal.tsx` — full terminal component
- `src/components/panels/TerminalPanel.tsx` — wire terminal
- `src/app/globals.css` — crt-glow
