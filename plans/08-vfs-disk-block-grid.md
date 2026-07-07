# Phase 8 — VFS Disk Block Grid & Inode Table

## Goal
Build the filesystem layer: 128-block disk grid (16×8), boot/superblock/inode/data block coloring, inode table UI, `ls` and `df` commands.

## Prerequisites
- Phase 3 (process data model — for PID tracking)

## Tasks

### 1. Filesystem types
**Status: DONE** — `src/types/filesystem.ts` matches the plan interface exactly.

### 2. Disk engine
**Status: DONE** — `createInitialDisk` exists in `src/lib/sim.ts` as `createInitialDiskState`. `createFile`, `deleteFile`, `ls`, `df`, and `diskFragPct` all exist in `src/lib/filesystem.ts`. Wired through terminal commands `create`, `rm`, `ls`, `df`.

### 3. Block colors
**Status: DONE** — `blockColor()` in `src/lib/colors.ts` returns red (BOOT), gold (SUPERBLOCK), blue (INODE_TABLE), green (used data), dark green (free data).

### 4. Block grid component
**Status: DONE** — `BlockGrid.tsx` has responsive sizing, `React.memo` optimization, `highlightedFile` hover prop, block labels (B/S/I/filled dot for used data).

### 5. Inode table component
**Status: DONE** — `InodeTable.tsx` renders 4 inodes with file name, blocks, size. Supports `onHighlight` callback for hovering to highlight file blocks in the grid.

### 6. FilesystemPanel
**Status: DONE** — Wired with `BlockGrid`, `InodeTable`, `StatTile` components showing blocks used, frag%, and file count with sparklines. Responsive sizing.

### 7. ls/df commands
**Status: DONE** — Both implemented in `filesystem.ts` and wired in `terminal.ts`.

### 8. Create/delete file commands
**Status: DONE** — `create <name> <blocks>` and `rm <name>` handlers in `terminal.ts`.

## Acceptance Criteria
- [x] Disk grid shows 128 blocks, 16 per row
- [x] Block 0 = red (B), block 1 = gold (S), blocks 2–5 = blue (I), rest = dark green
- [x] Used data blocks show a filled dot
- [x] Inode table shows 4 rows, all empty initially
- [x] `ls` returns "No files."
- [x] `df` shows 0/122 blocks used, inodes 0/4
- [x] `create` allocates blocks and an inode, `rm` frees them
- [x] Hovering an inode row highlights its blocks in the grid
- [x] Stat tiles show block usage, fragmentation %, and file count with sparklines

## Files Touched
- `src/types/filesystem.ts` — DiskBlock, INode, DiskState ✅
- `src/lib/filesystem.ts` — createInitialDisk, createFile, deleteFile, ls, df, diskFragPct ✅
- `src/lib/colors.ts` — blockColor ✅
- `src/components/filesystem/BlockGrid.tsx` — new ✅
- `src/components/filesystem/InodeTable.tsx` — new ✅
- `src/components/panels/FilesystemPanel.tsx` — wire ✅
- `src/lib/sim.ts` — createInitialDiskState ✅
- `src/lib/terminal.ts` — create, rm, ls, df handlers ✅
