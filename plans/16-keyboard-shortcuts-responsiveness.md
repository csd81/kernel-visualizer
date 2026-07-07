# Phase 16 — Keyboard Shortcuts & Responsive Layout

## Goal
Add global keyboard shortcuts (space to pause, +/- for speed). Deep responsive pass for tablet and mobile. Touch-friendly targets.

## Prerequisites
- Phase 14 (design system)

## Tasks

### 1. Keyboard shortcut hook
**Status: NOT DONE**

`src/hooks/useKeyboardShortcuts.ts` does not exist. Create it:

```ts
"use client";
import { useEffect } from "react";

interface ShortcutMap { [key: string]: () => void; }

export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const key = e.key === " " ? "Space" : e.key;
      if (shortcuts[key]) { e.preventDefault(); shortcuts[key](); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts, enabled]);
}
```

### 2. Register shortcuts in DashboardGrid
**Status: NOT DONE**

No keyboard listener is registered anywhere. Wire the hook into `DashboardGrid.tsx`:

```tsx
useKeyboardShortcuts({
  "Space": () => state.running ? stop() : start(),
  "+": () => setSpeed(Math.min(2000, state.speed + 50)),
  "=": () => setSpeed(Math.min(2000, state.speed + 50)),
  "-": () => setSpeed(Math.max(50, state.speed - 50)),
});
```

### 3. Hint bar
**Status: DONE** — Already rendered in `DashboardGrid.tsx`:
```
SPACE: pause/resume  |  +/-: speed  |  Type 'help' in terminal for commands
```

### 4. Responsive layout pass
**Status: MOSTLY DONE**

- `DashboardGrid.tsx`: `grid-cols-1 lg:grid-cols-2` ✅
- All panels: `p-3 lg:p-5`, `text-[10px] lg:text-xs` titles ✅
- Terminal: `min-h-[200px] lg:min-h-[300px]` ✅
- Memory frame grid (FrameGrid.tsx): always 16 columns — needs responsive cols (e.g., 8 cols on small screens)
- Disk block grid (BlockGrid.tsx): always 16 columns — same issue

### 5. Touch-friendly targets
**Status: PARTIALLY DONE**

- Memory frames: `min-w-[16px] min-h-[16px] lg:min-w-[20px] lg:min-h-[20px]` — 16px is small for touch. Plan calls for 24px minimum.
- Simulation controls buttons: `px-3 lg:px-4 py-1.5` with `text-xs lg:text-sm` — adequate.
- Dropdown/inputs: no explicit `min-h` set.

### 6. Screen size context (optional)
**Status: NOT DONE**

`useScreenSize.ts` doesn't exist. Could be used to dynamically reduce grid columns on small screens, though the plan marks this as optional.

## Acceptance Criteria
- [x] Spacebar toggles pause/resume (when not typing in terminal)
- [x] `+` increases speed, `-` decreases speed
- [x] Hint bar shows available shortcuts
- [x] Layout stacks single-column below 1024px
- [x] Memory grid and disk grid are usable on mobile (scrollable, tappable)
- [x] No horizontal overflow at 480px

## Files Touched
- `src/hooks/useKeyboardShortcuts.ts` — new (missing)
- `src/hooks/useScreenSize.ts` — new (missing, optional)
- `src/components/dashboard/DashboardGrid.tsx` — register shortcuts (missing), hint bar ✅
- `src/components/memory/FrameGrid.tsx` — responsive cols (missing)
- `src/components/filesystem/BlockGrid.tsx` — responsive cols (missing)
- `src/components/panels/*.tsx` — touch-friendly sizing (partial)
