# Phase 13 — File Operations + Fragmentation

## Goal
Implement `create`, `rm` commands. Allocate non-contiguous data blocks to simulate disk fragmentation. Visual links between file blocks.

## Tasks

### 1. `create filename blocks` command
- `create(fileName, numBlocks)`:
  1. Find a free inode
  2. Allocate `numBlocks` data blocks (non-contiguous where possible — allocate from random free blocks to simulate fragmentation)
  3. Update inode: mark used, store block pointers, set size = `numBlocks * 512`
  4. Mark blocks as used, colour dark green, show file ID
  5. Return `"Created ${fileName} (${numBlocks} blocks, inode ${inodeId})"`
- Validate: max 4 files (4 inodes), max block count per file, disk space check

### 2. `rm filename` command
- `rm(fileName)`:
  1. Find inode by fileName
  2. Free all data blocks (mark `used: false`, colour dark green → green)
  3. Free inode
  4. Return `"Deleted ${fileName} (freed ${N} blocks)"`

### 3. File block linking (visual)
- Use CSS outline or a shared colour accent to link blocks belonging to the same file
- Each file gets a distinct accent colour (different from the data block green)
- Add a coloured dot or small letter (A/B/C/D) in the top-left of each data block to indicate which file it belongs to
- In the inode table, show the block list as clickable numbers that highlight the corresponding block in the grid

### 4. Fragmentation visualisation
- `sim.disk.fragmentation = 0`
- On each `create`/`rm`, compute:
  - `usedBlocks`: number of allocated data blocks
  - `largestFreeRun`: longest contiguous free segment
  - `fragPct`: `(1 - largestFreeRun / (122 - usedBlocks)) * 100` (with 122 data blocks)
- Show in panel: `"Fragmentation: X%"` with a colour-coded bar
- When fragmentation is high (>50%), blocks of the same file are visibly scattered

### 5. `df` update
- Show actual block usage + fragmentation %

### 6. Verify
- `create test.txt 5` → 5 blocks turn dark green, inode occupied, file listed
- `create second.txt 8` → blocks allocated, may be interleaved
- Blocks of the same file have matching dots/letters
- `rm test.txt` → blocks freed, inode freed
- Fragmentation % changes based on allocation pattern
