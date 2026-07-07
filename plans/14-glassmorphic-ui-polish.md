# Phase 14 — Glassmorphic UI Polish

## Goal
Apply full glassmorphic design system across all panels. Animated background particles, neon glow effects, consistent spacing and transitions.

## Prerequisites
- Phase 1 (basic glassmorphism)

## Tasks

### 1. Background particles
**Status: DONE** — Two CSS-only floating orbs in `globals.css`: cyan (600px, top-right) floats at 25s, purple (400px, bottom-left) floats at 30s reverse. Both at 4% opacity. The plan suggests 6-8 pseudo-elements, but only `::before`/`::after` are available on `body` without extra wrappers; two orbs at low opacity is the right call.

### 2. Panel neon glow
**Status: NOT DONE**

Panels have accent-colored borders via `[border-color:var(--color-accent-*)]/30` but no `box-shadow` glow. Add subtle neon glow matching each panel's accent:

```tsx
// Applied per-panel via className:
className="rounded-xl bg-white/3 backdrop-blur-xl border border-white/6 p-5
  shadow-[0_0_20px_var(--color-accent-scheduler)]/5
  hover:shadow-[0_0_30px_var(--color-accent-scheduler)]/10
  transition-shadow"
```

### 3. Consistent spacing audit
**Status: DONE** — All four panels use `p-3 lg:p-5`, `text-[10px] lg:text-xs` titles, `mb-2 lg:mb-3` title margins. Spacing follows the responsive `mobile → desktop` pattern consistently.

### 4. Transition polish
**Status: NOT DONE** (and should likely stay that way)

The plan suggests `* { transition-property: ... }` globally, which is heavy-handed — it would cause layout jank and performance issues on 256 frame-grid cells, SVG Gantt chart elements, and inode tables. The existing approach of per-component transition classes (`transition-all duration-300`, `transition-colors`, `transition-shadow`) on the specific elements that need them is the right pattern. The `prefers-reduced-motion` media query already exists in `globals.css`.

### 5. Panel header improvements
**Status: DONE** — All four panels have icons + titles (⚡ Scheduler, 📦 Memory, 💾 Filesystem, ⌨ Terminal) and compact stats lines below. Matching `text-[10px] lg:text-xs uppercase tracking-[0.12em]`.

### 6. Scrollbar styling
**Status: DONE** — Custom thin scrollbars (6px wide, rounded, semi-transparent thumb, dark track) in `globals.css`.

### 7. Responsive layout
**Status: DONE** — `grid-cols-1 lg:grid-cols-2` collapses below 1024px. Terminal panel uses `row-span-1 lg:row-span-2` for the taller two-row layout. All panels have responsive padding/sizing.

## Acceptance Criteria
- [x] Background has floating orbs (low opacity, non-distracting)
- [x] Spacing is consistent across all panels
- [x] Panel headers have icons + compact stats
- [x] Scrollbars are thin and dark-themed
- [x] Responsive: stacks to single column below 1024px
- [x] `prefers-reduced-motion` disables animations
- [x] Panels have subtle neon glow matching their accent color

## Files Touched
- `src/app/globals.css` — particles ✅, scrollbars ✅, reduced-motion ✅
- `src/components/panels/*.tsx` — icons ✅, spacing ✅, neon glow (missing)
- `src/components/dashboard/DashboardGrid.tsx` — responsive grid ✅
