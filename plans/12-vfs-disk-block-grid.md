# Phase 12 — VFS Disk Block Grid

## Goal
Build the filesystem layer: 128-block disk grid, inode table, boot/superblock colouring. `ls` and `df` commands.

## Tasks

### 1. Disk data model
- `sim.disk = { blocks: new Array(128), inodes: new Array(4) }`
- Block types:
  - `BOOT` (block 0) — red
  - `SUPERBLOCK` (block 1) — gold/amber
  - `INODE_TABLE` (blocks 2–5) — blue (4 inodes, 1 block each)
  - `DATA` (blocks 6–127) — green when free, dark green when used
- Each data block: `{ type: 'DATA', used: false, pid: null, fileId: null }`

### 2. Block colouring
- Free data block: `#2d4a2d` (dark green)
- Used data block: `#4caf50` (bright green)
- Boot: `#e53935` (red)
- Superblock: `#ffb300` (gold)
- Inode table: `#1e88e5` (blue)

### 3. 128-block grid rendering
- In `#panel-filesystem .panel-content`, insert `<div id="disk-grid">`
- CSS Grid: `grid-template-columns: repeat(16, 1fr)`, `gap: 2px`
- Each block: `<div class="disk-block" data-block="N">`
- Block 0 labelled "B", block 1 "S", blocks 2–5 "I", data blocks show file ID or "‧"

### 4. INode table
- Each inode: `{ id: N, used: false, fileId: null, size: 0, blocks: [], pid: null }`
- Show inode table as a small 4-row table below the disk grid:
  - `INode | File | Blocks | Size`
- Free inodes are dimmed

### 5. `ls` command
- `ls()`:
  - Scans inodes, lists files
  - `"file_a.txt  blocks=[12,15,16]  size=1536B"`
  - Returns formatted string
- `df()`:
  - `"Disk: 12/122 blocks used (10%)  |  Free inodes: 2/4"`

### 6. Verify
- Open page → disk grid shows 128 blocks (16×8 or 16×16 layout)
- Block 0 red, block 1 gold, blocks 2–5 blue, rest dark green
- Inode table panel shows 4 rows, all dimmed/free
- `ls` returns empty (no files yet)
- `df` shows 0 blocks used, 4 free inodes
