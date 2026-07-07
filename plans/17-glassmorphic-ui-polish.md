# Phase 17 — Glassmorphic UI Polish

## Goal
Apply full glassmorphic design system: backdrop blur, neon accent borders per subsystem, animated background particles, consistent typography and spacing.

## Tasks

### 1. Dark gradient background
- Body: radial gradient from `#0b0e14` (center) to `#06080c` (edges)
- Optional: subtle grid pattern overlay on the body background (CSS `background-image` with a repeating SVG pattern)

### 2. Glassmorphic panels
- Each `.panel`:
  - `background: rgba(255, 255, 255, 0.03)` (more transparent than Phase 1)
  - `backdrop-filter: blur(16px)`
  - `-webkit-backdrop-filter: blur(16px)`
  - `border: 1px solid rgba(255, 255, 255, 0.06)`
  - `box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3)`
  - `transition: border-color 0.3s, box-shadow 0.3s`

### 3. Neon accent borders
- Per-panel accent colours (applied via additional class or data attribute):
  - Scheduler: `#00e5ff` (cyan) — `border-color: rgba(0, 229, 255, 0.3)`
  - Memory: `#d500f9` (magenta) — `border-color: rgba(213, 0, 249, 0.3)`
  - Filesystem: `#ffab00` (amber) — `border-color: rgba(255, 171, 0, 0.3)`
  - Terminal: `#33ff33` (green) — `border-color: rgba(51, 255, 51, 0.3)`
- On hover, brighten the border to `0.6` opacity

### 4. Animated background particles
- CSS-only approach: use multiple `@keyframes` on pseudo-elements or a small canvas overlay
- Alternative: several `<div>` particles with randomised CSS animation delays, floating slowly upwards
- Low opacity (`0.03–0.06`), small circles (`2–6px`)
- Must not interfere with click events (`pointer-events: none`)

### 5. Typography
- Panel titles: uppercase, `letter-spacing: 0.12em`, `font-size: 0.7rem`, `color: rgba(255,255,255,0.4)`, small separator line below
- Body text: system font stack with monospace for data displays
- Consistent `font-size` scale (0.7rem / 0.8rem / 0.9rem / 1rem)

### 6. Responsive grid
- Default: 2×2 grid
- Below 1024px: 1×4 stack
- Panels collapse gracefully, content scrolls internally
- Terminal panel has a min-height so it doesn't collapse to zero

### 7. Smooth transitions
- All interactive elements: `transition: all 0.2s ease`
- Panel focus: slight glow on hover
- Number changes (counters): subtle `transition: color 0.3s`

### 8. Verify
- Four panels with distinct subtle neon glows (cyan, magenta, amber, green)
- Background has gradient + subtle particles floating
- Resize browser → panels stack vertically on narrow screens
- Hover a panel → border brightens slightly
- Overall feel: premium glassmorphic dark UI
