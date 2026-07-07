# Phase 17 — Export/Import State & Preset Scenarios

## Goal
Allow saving and loading full simulation state as JSON. Provide preset demo scenarios (cpu-demo, memory-pressure, disk-frag, deadlock).

## Prerequisites
- All phases complete (full sim state)

## Tasks

### 1. Export state

**File: `src/lib/presets.ts`**

```ts
import type { SimState } from "@/types/sim";

export function exportState(state: SimState): string {
  const data = {
    version: 1,
    exportedAt: Date.now(),
    tick: state.tick,
    processes: state.processes,
    memory: state.memory,
    disk: state.disk,
    stats: state.stats,
  };
  return JSON.stringify(data, null, 2);
}
```

**Shell command**: `export-state` serializes state, copies to clipboard and/or triggers a download:

```ts
// In processShellCommand:
case "export-state": {
  const json = exportState(state);
  // Try clipboard API, fall back to text output
  try {
    await navigator.clipboard.writeText(json);
    output = addLine(output, "State copied to clipboard.", "success");
  } catch {
    output = addLine(output, json.substring(0, 500) + "...\n(Full state too long — use download button in UI)", "info");
  }
  break;
}
```

Add a small download button in the header or controls bar:
```tsx
<button onClick={() => downloadState(state)} className="text-[10px] text-text-muted hover:text-text-secondary">
  💾 Save
</button>
```

### 2. Import state

```ts
import { exportState } from "@/lib/presets";

export function importState(json: string): { state: SimState | null; error: string | null } {
  try {
    const data = JSON.parse(json);
    if (!data.version || data.processes === undefined) {
      return { state: null, error: "Invalid state file" };
    }
    // Validate basic structure
    return { state: data as SimState, error: null };
  } catch {
    return { state: null, error: "Invalid JSON" };
  }
}
```

**Shell command**: `import-state <json>` or a file upload UI button.

### 3. Preset scenarios

```ts
export type PresetName = "empty" | "cpu-demo" | "memory-pressure" | "disk-frag" | "deadlock";

export function loadPreset(state: SimState, name: PresetName): SimState {
  switch (name) {
    case "empty":
      return createInitialState();
    case "cpu-demo": {
      let s = createInitialState();
      // Fork 6 processes with varying ticks
      for (let i = 0; i < 6; i++) {
        const result = fork(s, 5 + i * 3, i < 2 ? 9 : 3);
        s = result.state;
      }
      return { ...s, scheduler: "rr", quantum: 3, running: true };
    }
    case "memory-pressure": {
      let s = createInitialState();
      s = fork(s, 10, 5).state;
      // Allocate 80% of memory
      const allocResult = allocateFrames(s.memory, 1, Math.floor(256 * 0.8));
      if (!allocResult.message) s = { ...s, memory: allocResult.memory };
      return { ...s, running: true };
    }
    case "disk-frag": {
      let s = createInitialState();
      // Create and delete files to fragment disk
      s = createFile(s.disk, "a.txt", 10).disk; // unused disk
      s = createFile(s.disk, "b.txt", 15).disk;
      s = deleteFile(s.disk, "a.txt").disk;
      s = createFile(s.disk, "c.txt", 8).disk;
      return { ...s, running: true };
    }
    case "deadlock": {
      // Set up two processes, each holding one frame, waiting for each other's
      // (Simplified — Phase 19 has the real deadlock mechanics)
      let s = createInitialState();
      s = fork(s, 20, 5).state;
      s = fork(s, 20, 5).state;
      return { ...s, running: true };
    }
    default:
      return state;
  }
}
```

### 4. Preset loader UI

Add a `<select>` in the simulation controls bar:

```tsx
<select
  value=""
  onChange={e => {
    if (e.target.value) loadPreset(e.target.value as PresetName);
  }}
  className="bg-white/6 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-text-primary"
>
  <option value="">Load Preset…</option>
  <option value="empty">Empty</option>
  <option value="cpu-demo">CPU Demo (6 processes, RR)</option>
  <option value="memory-pressure">Memory Pressure (80% used)</option>
  <option value="disk-frag">Disk Fragmentation</option>
  <option value="deadlock">Deadlock Demo</option>
</select>
```

### 5. Shell commands

Add `export-state`, `import-state`, `load-preset` to `processShellCommand`.

## Acceptance Criteria
- [ ] `export-state` outputs JSON in the terminal (or clipboard)
- [ ] Download button saves a `.json` file
- [ ] `load-preset cpu-demo` sets up 6 processes with RR scheduler
- [ ] `load-preset memory-pressure` shows ~80% used frames
- [ ] `load-preset disk-frag` shows fragmented disk blocks
- [ ] Import from JSON string works via command
- [ ] Error handling for invalid JSON files

## Files Touched
- `src/lib/presets.ts` — exportState, importState, loadPreset
- `src/lib/terminal.ts` — new case branches
- `src/components/dashboard/SimulationControls.tsx` — preset selector, download button
