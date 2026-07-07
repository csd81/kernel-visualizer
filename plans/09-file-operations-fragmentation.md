# Phase 9 — File Operations & Disk Fragmentation

## Goal
Implement `create` and `rm` commands. Non-contiguous block allocation to simulate fragmentation. Visual linking of file blocks. Fragmentation percentage display.

## Prerequisites
- Phase 8 (disk grid, inode table)

## Tasks

### 1. File operations

**File: `src/lib/filesystem.ts`**

```ts
export function createFile(disk: DiskState, fileName: string, numBlocks: number):
  { disk: DiskState; message: string } {

  // Check if file already exists
  if (disk.inodes.some(i => i.fileName === fileName)) {
    return { disk, message: `Error: '${fileName}' already exists` };
  }

  // Find free inode
  const inodeIdx = disk.inodes.findIndex(i => !i.used);
  if (inodeIdx === -1) {
    return { disk, message: "Error: no free inodes (max 4 files)" };
  }

  // Find free data blocks (intentionally scattered — grab every other free block to simulate fragmentation)
  const freeBlocks = disk.blocks
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => b.type === "DATA" && !b.used);

  if (freeBlocks.length < numBlocks) {
    return { disk, message: `Error: disk full (${freeBlocks.length} free blocks, need ${numBlocks})` };
  }

  // Scatter allocation: alternate between early and late free blocks
  const allocated: number[] = [];
  let low = 0, high = freeBlocks.length - 1;
  for (let i = 0; i < numBlocks; i++) {
    const idx = i % 2 === 0 ? freeBlocks[low++].i : freeBlocks[high--].i;
    allocated.push(idx);
  }

  const blocks = disk.blocks.map(b =>
    allocated.includes(b.id) ? { ...b, used: true, fileId: fileName } : b
  );

  const inodes = disk.inodes.map((inode, i) =>
    i === inodeIdx
      ? { ...inode, used: true, fileName, size: numBlocks * BLOCK_SIZE, blocks: allocated, pid: null }
      : inode
  );

  return {
    disk: { ...disk, blocks, inodes },
    message: `Created '${fileName}' (${numBlocks} blocks, inode ${inodeIdx}, ${numBlocks * BLOCK_SIZE}B)`,
  };
}

export function deleteFile(disk: DiskState, fileName: string):
  { disk: DiskState; message: string } {

  const inodeIdx = disk.inodes.findIndex(i => i.fileName === fileName);
  if (inodeIdx === -1) return { disk, message: `Error: '${fileName}' not found` };

  const inode = disk.inodes[inodeIdx];
  const blocks = disk.blocks.map(b =>
    inode.blocks.includes(b.id) ? { ...b, used: false, fileId: null } : b
  );

  const inodes = disk.inodes.map((inode, i) =>
    i === inodeIdx
      ? { id: i, used: false, fileName: null, size: 0, blocks: [], pid: null }
      : inode
  );

  return {
    disk: { ...disk, blocks, inodes },
    message: `Deleted '${fileName}' (freed ${inode.blocks.length} blocks)`,
  };
}
```

### 2. Fragmentation computation

```ts
export function diskFragPct(blocks: DiskBlock[]): number {
  const dataBlocks = blocks.filter(b => b.type === "DATA");
  const used = dataBlocks.filter(b => b.used).length;
  const free = dataBlocks.length - used;
  if (free <= 1) return 0;
  let maxRun = 0, cur = 0;
  for (const b of dataBlocks) {
    if (!b.used) { cur++; maxRun = Math.max(maxRun, cur); }
    else cur = 0;
  }
  return Math.round((1 - maxRun / free) * 100);
}
```

### 3. Visual: file block highlighting

When hovering over a file in the inode table, highlight its blocks in the grid with a brighter border. Use state in `FilesystemPanel`:

```tsx
const [highlightedFile, setHighlightedFile] = useState<string | null>(null);
```

The block grid then applies a gold ring to blocks matching `highlightedFile`.

### 4. Fragmentation bar

Add a small visual bar below the block grid showing fragmentation level:

```tsx
const fragPct = diskFragPct(state.disk.blocks);
const fragColor = fragPct > 75 ? "bg-red-500" : fragPct > 50 ? "bg-yellow-500" : "bg-green-500";

<div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-text-secondary">
  <span>Fragmentation:</span>
  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
    <div className={`h-full rounded-full ${fragColor} transition-all duration-500`} style={{ width: `${fragPct}%` }} />
  </div>
  <span className={fragPct > 75 ? "text-red-400" : fragPct > 50 ? "text-yellow-400" : ""}>{fragPct}%</span>
</div>
```

### 5. Expose via context

Add `create(fileName, numBlocks)`, `rm(fileName)` to `SimulationContext`.

## Acceptance Criteria
- [ ] `create test.txt 5` → allocates blocks across the disk, inode shows file
- [ ] Blocks of same file have matching visual link (hover highlights them together)
- [ ] `rm test.txt` → blocks return to dark green, inode freed
- [ ] Fragmentation % changes after multiple creates and deletes
- [ ] `create file.txt 200` → "disk full" error
- [ ] `create test.txt 3` followed by another `create test.txt 3` → "already exists" error
- [ ] `rm nonexistent.txt` → "not found" error

## Files Touched
- `src/lib/filesystem.ts` — createFile, deleteFile, diskFragPct
- `src/components/panels/FilesystemPanel.tsx` — fragment bar, highlight state
- `src/components/filesystem/BlockGrid.tsx` — highlightedFile prop
- `src/components/filesystem/InodeTable.tsx` — onHover callback
- `src/hooks/SimulationContext.tsx` — create, rm
