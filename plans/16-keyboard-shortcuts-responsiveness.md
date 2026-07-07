# Phase 16 — Keyboard Shortcuts & Responsive Layout

## Goal
Add global keyboard shortcuts (space to pause, +/- for speed). Deep responsive pass for tablet and mobile. Touch-friendly targets.

## Prerequisites
- Phase 14 (design system)

## Tasks

### 1. Keyboard shortcut hook

**File: `src/hooks/useKeyboardShortcuts.ts`**

```ts
"use client";

import { useEffect } from "react";

interface ShortcutMap {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in terminal or other inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = e.key === " " ? "Space" : e.key;
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts, enabled]);
}
```

### 2. Register shortcuts

In `DashboardGrid.tsx`:

```tsx
useKeyboardShortcuts({
  "Space": () => state.running ? stop() : start(),
  "=": () => setSpeed(Math.min(2000, state.speed + 50)),
  "+": () => setSpeed(Math.min(2000, state.speed + 50)),
  "-": () => setSpeed(Math.max(50, state.speed - 50)),
});
```

Add a hint bar below the header:
```tsx
<div className="text-[10px] text-text-muted text-center px-2">
  SPACE: pause/resume  |  +/-: speed  |  Type 'help' in terminal for commands
</div>
```

### 3. Responsive layout pass

Test and fix at 1280px, 1024px, 768px, 480px.

**DashboardGrid.tsx**:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 flex-1">
```

**Memory frame grid**: at small screens, reduce to 8 columns instead of 16 (to make frames tappable):
```tsx
const cols = typeof window !== "undefined" && window.innerWidth < 640 ? 8 : 16;
```

**Process cards**: smaller padding and font at narrow widths.

**Terminal**: minimum height of 200px.

### 4. Touch-friendly targets

- Memory frames: minimum `24px × 24px` (`min-w-[24px] min-h-[24px]`)
- Disk blocks: minimum `16px × 16px`
- Buttons: minimum `36px` height, `padding: 0.5rem 1rem`
- Dropdown/input: `min-h-[28px]`

### 5. Screen size context (optional)

**File: `src/hooks/useScreenSize.ts`**

```ts
export function useScreenSize(): { width: number; height: number; sm: boolean; md: boolean; lg: boolean } {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const handle = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return { ...size, sm: size.width < 640, md: size.width < 1024, lg: size.width >= 1024 };
}
```

Use to conditionally shorten labels, reduce grid size, or stack stats vertically.

## Acceptance Criteria
- [ ] Spacebar toggles pause/resume (when not typing in terminal)
- [ ] `+` increases speed, `-` decreases speed
- [ ] Hint bar shows available shortcuts
- [ ] Layout stacks single-column at 768px
- [ ] Memory grid and disk grid are usable on mobile (scrollable, tappable)
- [ ] No horizontal overflow at 480px

## Files Touched
- `src/hooks/useKeyboardShortcuts.ts` — new
- `src/hooks/useScreenSize.ts` — new
- `src/components/dashboard/DashboardGrid.tsx` — register shortcuts, hint bar
- `src/components/memory/FrameGrid.tsx` — responsive cols
- `src/components/filesystem/BlockGrid.tsx` — responsive cols
- `src/components/panels/*.tsx` — touch-friendly sizing pass
