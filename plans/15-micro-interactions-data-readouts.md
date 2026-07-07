# Phase 15 — Micro-Interactions & Data Readouts

## Goal
Add live sparklines for CPU utilization, memory pressure, disk usage. Micro-interactions (hover, tooltips) on every interactive element. Compact stat tiles per panel.

## Prerequisites
- Phase 14 (glassmorphic design)

## Tasks

### 1. Sparkline SVG component

**File: `src/components/shared/Sparkline.tsx`**

```tsx
import { useMemo } from "react";

interface Props {
  data: number[];
  color?: string;
  maxPoints?: number;
  width?: number;
  height?: number;
  fill?: boolean;
}

export default function Sparkline({ data, color = "#00e5ff", width = 80, height = 24, fill = false }: Props) {
  const path = useMemo(() => {
    const points = data.slice(-100);
    if (points.length < 2) return "";
    const max = Math.max(...points, 1);
    const min = Math.min(...points, 0);
    const range = max - min || 1;
    const stepX = width / (points.length - 1);
    const d = points.map((v, i) =>
      `${i === 0 ? "M" : "L"} ${i * stepX}, ${height - ((v - min) / range) * (height - 2) - 1}`
    ).join(" ");
    if (fill) {
      const bottom = height - ((-min) / range) * (height - 2) - 1;
      return `${d} L ${width}, ${bottom} L 0, ${bottom} Z`;
    }
    return d;
  }, [data, width, height, fill]);

  if (!path) return <div style={{ width, height }} />;

  return (
    <svg width={width} height={height} className="shrink-0">
      <path d={path} fill={fill ? `${color}15` : "none"} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}
```

### 2. Track stats arrays

**File: `src/types/sim.ts`** — add to `SimStats`:

```ts
export interface SimStats {
  contextSwitches: number;
  pageFaults: number;
  cpuUtil: number[];      // last 100 values
  memoryPressure: number[]; // last 100 values
  diskUsage: number[];     // last 100 values
}
```

Update tick to push values each tick:
```ts
stats.cpuUtil.push(running ? 100 : cpuUtilPercent);
stats.memoryPressure.push(usedFrames / 256 * 100);
stats.diskUsage.push(usedDataBlocks / 122 * 100);
// Cap at 100
if (stats.cpuUtil.length > 100) stats.cpuUtil.shift();
```

### 3. Stat tile component

**File: `src/components/shared/StatTile.tsx`**

```tsx
interface Props {
  icon: string;
  label: string;
  value: string | number;
  sparkline?: number[];
  sparkColor?: string;
  warn?: boolean;
  critical?: boolean;
}

export default function StatTile({ icon, label, value, sparkline, sparkColor, warn, critical }: Props) {
  return (
    <div className="flex items-center gap-2 bg-white/3 rounded-lg px-2 py-1.5">
      <span className="text-xs">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] uppercase tracking-wider text-text-muted">{label}</div>
        <div className={`text-xs font-mono font-semibold ${critical ? "text-red-400" : warn ? "text-yellow-400" : "text-text-primary"}`}>
          {value}
        </div>
      </div>
      {sparkline && <Sparkline data={sparkline} color={sparkColor} />}
    </div>
  );
}
```

### 4. Stat bars per panel

Add a stat-bar row to each panel:

- **Scheduler**: `⚡ CPU: 67%` (sparkline cyan) | `⤵ CTX: 42` | `⏱ Ticks: 156`
- **Memory**: `📦 Used: 84/256` (sparkline magenta) | `⚠ PF: 3`
- **Filesystem**: `💾 Blocks: 18/122` (sparkline amber) | `🗂 Files: 2`

### 5. Hover micro-interactions

- **Process cards**: `hover:scale-105` with tooltip showing full details
- **Memory frames**: `hover:brightness-150 hover:scale-110` with frame number overlay
- **Disk blocks**: `hover:brightness-150` with tooltip showing block type and file ID
- **Gantt bars**: `hover:opacity-100` (default 0.7) with SVG `<title>` tooltip
- **All buttons/selects**: `hover:bg-white/10 transition-colors`

### 6. Color-coded thresholds

```tsx
const thresholdClass = (value: number, warnAt: number, critAt: number) =>
  value >= critAt ? "text-red-400" : value >= warnAt ? "text-yellow-400" : "";
```

Apply to:
- CPU utilization: warn > 80, crit > 95
- Memory usage: warn > 80, crit > 95
- Disk usage: warn > 75, crit > 90
- Fragmentation: warn > 50, crit > 75

## Acceptance Criteria
- [ ] Sparklines animate smoothly as ticks progress
- [ ] Stat tiles update every tick with current values
- [ ] CPU/memory/disk sparklines in their respective panels
- [ ] Hover on any interactive element shows visual feedback
- [ ] Thresholds change text color (yellow → red) at warning/critical levels
- [ ] No performance degradation after 1000+ ticks (sparklines capped at 100 points)

## Files Touched
- `src/components/shared/Sparkline.tsx` — new
- `src/components/shared/StatTile.tsx` — new
- `src/types/sim.ts` — extended SimStats
- `src/lib/sim.ts` — push stats arrays each tick
- `src/components/panels/SchedulerPanel.tsx` — stat tile row
- `src/components/panels/MemoryPanel.tsx` — stat tile row
- `src/components/panels/FilesystemPanel.tsx` — stat tile row
- `src/components/scheduler/ProcessCard.tsx` — hover tooltip
- `src/components/memory/FrameGrid.tsx` — hover scale
- `src/components/filesystem/BlockGrid.tsx` — hover brighten
