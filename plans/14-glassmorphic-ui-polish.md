# Phase 14 — Glassmorphic UI Polish

## Goal
Apply full glassmorphic design system across all panels. Animated background particles, neon glow effects, consistent spacing and transitions.

## Prerequisites
- Phase 1 (basic glassmorphism)

## Tasks

### 1. Background particles

**File: `src/app/globals.css`**

CSS-only floating particle animation. Add 6–8 `::before`/`::after` gradient orbs on the body with different size, position, and delay:

```css
body::before, body::after {
  content: '';
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: -1;
}
body::before {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(0, 229, 255, 0.04), transparent 70%);
  top: -200px; right: -200px;
  animation: float-particle 20s ease-in-out infinite;
}
body::after {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(213, 0, 249, 0.04), transparent 70%);
  bottom: -100px; left: -100px;
  animation: float-particle 25s ease-in-out infinite reverse;
}
/* Add 2-3 more pseudo-elements or use additional wrapper divs */
```

Alternatively, a `<ParticleField>` React component that renders small `<div>` elements with randomized CSS animations.

### 2. Panel neon glow

Each panel's accent border gets a subtle neon glow using `box-shadow`:

```css
.panel-accent-scheduler {
  border-color: rgba(0, 229, 255, 0.3);
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.03), 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

Apply via Tailwind: `className="shadow-[0_0_20px_rgba(0,229,255,0.03)]"`

### 3. Consistent spacing audit

All panels follow the same internal spacing:
- Padding: `p-5` (1.25rem)
- Title margin: `mb-3` (0.75rem)
- Between sections: `mt-3` / `space-y-3`
- Inner cards: `p-2` or `p-3`

### 4. Transition polish

Add smooth transitions to all interactive elements:

```css
* { transition-property: background-color, border-color, color, opacity, transform, box-shadow; transition-duration: 0.2s; transition-timing-function: ease; }
```

But exclude `opacity` and `transform` on page load — use `motion-reduce` media query to disable animations for users who prefer reduced motion.

### 5. Panel header improvements

Unify panel headers:
- Small icon + title (e.g., `⚡ Scheduler`, `📦 Memory`, `💾 Filesystem`, `⌨ Terminal`)
- Stats line below: compact, monospace, font-size `[10px]`

### 6. Scrollbar styling

Custom thin scrollbars matching the dark theme:

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
```

### 7. Responsive layout

Ensure the 2×2 grid collapses gracefully:
- `lg:grid-cols-2` at ≥1024px
- Single column below that
- Terminal panel uses `row-span-2` on large screens

## Acceptance Criteria
- [ ] Four panels have subtle neon glow matching their accent color
- [ ] Background has floating orbs/particles (low opacity, doesn't distract)
- [ ] Spacing is consistent across all panels
- [ ] Hover/transition effects are smooth (0.2s ease)
- [ ] Scrollbars are thin and dark
- [ ] Responsive: stacks to single column below 1024px
- [ ] `prefers-reduced-motion` disables animations

## Files Touched
- `src/app/globals.css` — particles, scrollbars, transitions, reduced-motion
- `src/components/panels/*.tsx` — icons, spacing pass
- `src/components/dashboard/DashboardGrid.tsx` — responsive grid
