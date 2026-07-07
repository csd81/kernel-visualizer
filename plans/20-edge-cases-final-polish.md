# Phase 20 — Edge Cases & Final Polish

## Goal
Sweep all edge cases. Add welcome message, favicon, error boundaries, reset functionality. Final visual polish pass.

## Prerequisites
- All prior phases

## Tasks

### 1. Edge-case sweep

Test and handle every failure mode:

| Scenario | Expected Behavior |
|---|---|
| `fork` with max PIDs (1024) | Error: "maximum processes reached" |
| `alloc` with negative size | Clamp or reject with "invalid size" |
| `alloc` with 0 size | Reject with "invalid size" |
| `kill` already terminated PID | "already terminated" |
| `create` when all inodes used | "no free inodes" |
| `create` with empty name | Reject with "invalid filename" |
| `rm` non-existent file | "not found" |
| `speed 0` / negative | Clamp to 50ms |
| `speed 10000` | Clamp to 2000ms |
| Empty command | No-op |
| Whitespace-only command | No-op |
| Very long command (>200 chars) | Truncate |
| Non-numeric args to numeric params | Usage error |
| All memory allocated | Next alloc fails with clear message |
| All disk blocks used | Next create fails with "disk full" |
| Both memory AND disk full | Error names both resources |
| Pause while already paused | No-op |
| Resume while already running | No-op |
| Load preset while simulation is running | Confirm dialog |
| `export-state` when state is empty | Still exports valid JSON |
| `import-state` with malformed JSON | "Invalid JSON" error |
| `import-state` with wrong structure | "Invalid state file" error |

Each check is a guard clause in the respective engine function or terminal parser.

### 2. Welcome message

On first load, display a welcome message in the terminal:

```
╔══════════════════════════════════════╗
║   Kernel Visualizer v1.0              ║
║   Interactive OS Simulator           ║
║                                      ║
║   Type 'help' to get started.         ║
╚══════════════════════════════════════╝
```

Add as initial terminal output in `createInitialState()`.

### 3. Error boundaries

**File: `src/components/shared/ErrorBoundary.tsx`**

```tsx
"use client";

import { Component } from "react";

export default class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-red-400 text-xs font-mono">
          ⚠️ Panel error — check console
        </div>
      );
    }
    return this.props.children;
  }
}
```

Wrap each panel in `DashboardGrid.tsx`:

```tsx
<ErrorBoundary>
  <SchedulerPanel />
</ErrorBoundary>
```

### 4. Reset simulation

Add `reset-sim` shell command and a reset button in the controls:

```ts
case "reset-sim": {
  const fresh = createInitialState();
  output = addLine([], "Simulation reset.", "info");
  return { ...fresh, terminal: { ...fresh.terminal, output } };
}
```

### 5. Favicon

**File: `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="4" fill="#0b0e14"/>
  <text x="16" y="22" font-family="monospace" font-size="18" font-weight="bold" fill="#00e5ff" text-anchor="middle">K</text>
</svg>
```

Update `layout.tsx` to reference it:
```tsx
export const metadata: Metadata = {
  title: "Kernel Visualizer",
  description: "Interactive Linux kernel simulator",
  icons: { icon: "/favicon.svg" },
};
```

### 6. Final visual polish

- **Consistent spacing**: audit every component for `padding`, `margin`, `gap` consistency
- **Transitions**: every state change has `transition-*` classes
- **Empty states**: "No processes", "No files", "Click a frame" shown in muted italic text
- **Loading state**: not applicable (client-side only, instant) — but add `skeleton` placeholder if needed
- **Error state**: error boundaries catch and display per-panel fallbacks
- **Focus ring**: visible focus-visible outline on all interactive elements for accessibility

### 7. Accessibility pass

- All interactive elements have visible focus styles (`focus-visible:ring-2`)
- Terminal input auto-focuses on page load
- Color is not the only differentiator — add text labels where color conveys meaning (process state, block types)
- Reduced motion: `@media (prefers-reduced-motion: no-preference)` wraps animations

### 8. Console noise cleanup

Ensure no React warnings, no `console.log` from production code, no uncaught promise rejections.

### 9. Shell history persistence

Use `sessionStorage` to persist terminal history across page reloads (but not sim state — that's explicit export/import).

```ts
// In useSimulation, on mount:
const savedHistory = sessionStorage.getItem("kv-terminal-history");
// On unmount:
sessionStorage.setItem("kv-terminal-history", JSON.stringify(state.terminal.history));
```

## Acceptance Criteria
- [ ] Every edge case returns a user-friendly error message (not a crash)
- [ ] Welcome message shows on first load
- [ ] Error boundaries catch and display per-panel errors
- [ ] `reset-sim` returns to clean state with welcome message
- [ ] Favicon appears in browser tab
- [ ] Focus outlines visible on keyboard navigation
- [ ] No console errors or warnings
- [ ] Terminal history persists across page reloads
- [ ] All panels handle empty/null state gracefully

## Files Touched
- `src/components/shared/ErrorBoundary.tsx` — new
- `src/components/dashboard/DashboardGrid.tsx` — error boundaries, reset button
- `src/lib/terminal.ts` — all edge case guards
- `src/lib/sim.ts` — welcome message in initial state
- `src/lib/presets.ts` — reset-sim handler
- `src/app/layout.tsx` — favicon metadata
- `public/favicon.svg` — new
- `src/hooks/useSimulation.ts` — sessionStorage for history
- All panel components — empty state displays, spacing audit, accessibility
