# Phase 9 — File Operations & Disk Fragmentation

## Goal
Implement `create` and `rm` commands. Non-contiguous block allocation to simulate fragmentation. Visual linking of file blocks. Fragmentation percentage display.

## Prerequisites
- Phase 8 (disk grid, inode table)

## Tasks

### 1. File operations (create / delete)
**Status: DONE** — `createFile()` and `deleteFile()` exist in `src/lib/filesystem.ts`. Both are wired through terminal commands `create <name> <blocks>` and `rm <name>` in `src/lib/terminal.ts`. The scatter allocation alternates between low-index and high-index free blocks to visibly simulate fragmentation.

### 2. Fragmentation computation
**Status: DONE** — `diskFragPct()` in `src/lib/filesystem.ts` computes fragmentation as `1 - (largestFreeRun / totalFree)`.

### 3. File block highlighting
**Status: DONE** — `BlockGrid.tsx` accepts a `highlightedFile` prop and applies a gold ring to matching blocks. `InodeTable.tsx` fires `onHighlight` on hover. `FilesystemPanel.tsx` manages the shared state.

### 4. Fragmentation display
**Status: DONE** — Displayed as a `StatTile` in `FilesystemPanel.tsx` with warning/critical color thresholds (50%/75%). Equivalent to the plan's frag bar but more compact and consistent with the dashboard's other stat tiles.

### 5. Expose via context
**Status: DONE** — `create` and `rm` are routed through `processShellCommand` in `terminal.ts`. The `create` handler parses name and block count and delegates to `createFile()`. The `rm` handler delegates to `deleteFile()`.

## Acceptance Criteria
- [x] `create test.txt 5` → allocates scattered blocks across the disk, inode shows file
- [x] Blocks of same file have matching visual link (hover highlights them together with gold ring)
- [x] `rm test.txt` → blocks return to dark green, inode freed
- [x] Fragmentation % updates after creates and deletes
- [x] `create file.txt 200` → "disk full" error
- [x] `create test.txt 3` followed by second `create test.txt 3` → "already exists" error
- [x] `rm nonexistent.txt` → "not found" error

## Files Touched
- `src/lib/filesystem.ts` — createFile, deleteFile, diskFragPct ✅
- `src/components/panels/FilesystemPanel.tsx` — frag tile, highlight state ✅
- `src/components/filesystem/BlockGrid.tsx` — highlightedFile prop ✅
- `src/components/filesystem/InodeTable.tsx` — onHighlight callback ✅
- `src/lib/terminal.ts` — create, rm handlers ✅
