# Phase 8 — VFS Disk Block Grid & Inode Table

## Goal
Build the filesystem layer: 128-block disk grid (16×8), boot/superblock/inode/data block coloring, inode table UI, `ls` and `df` commands.

## Prerequisites
- Phase 3 (process data model — for PID tracking)

## Tasks

### 1. Filesystem types

**File: `src/types/filesystem.ts`**

```ts
export type BlockType = "BOOT" | "SUPERBLOCK" | "INODE_TABLE" | "DATA";

export interface DiskBlock {
  id: number;
  type: BlockType;
  used: boolean;
  pid: number | null;
  fileId: string | null;
}

export interface INode {
  id: number;
  used: boolean;
  fileName: string | null;
  size: number;
  blocks: number[];
  pid: number | null;
}

export interface DiskState {
  blocks: DiskBlock[];
  inodes: INode[];
}
```

### 2. Disk engine

**File: `src/lib/filesystem.ts`**

```ts
import type { DiskState, DiskBlock, INode } from "@/types/filesystem";

export const TOTAL_BLOCKS = 128;
export const BLOCK_SIZE = 512;
export const TOTAL_INODES = 4;
export const DATA_START = 6;  // blocks 0–5 are reserved

export function createInitialDisk(): DiskState {
  const blocks: DiskBlock[] = [];
  for (let i = 0; i < TOTAL_BLOCKS; i++) {
    let type: BlockType = "DATA";
    if (i === 0) type = "BOOT";
    else if (i === 1) type = "SUPERBLOCK";
    else if (i >= 2 && i <= 5) type = "INODE_TABLE";
    blocks.push({ id: i, type, used: type !== "DATA", pid: null, fileId: null });
  }
  return {
    blocks,
    inodes: Array.from({ length: TOTAL_INODES }, (_, i) => ({
      id: i, used: false, fileName: null, size: 0, blocks: [], pid: null,
    })),
  };
}
```

### 3. Block colors

**File: `src/lib/colors.ts`**

```ts
export function blockColor(block: DiskBlock): string {
  if (block.type === "BOOT") return "#e53935";        // red
  if (block.type === "SUPERBLOCK") return "#ffb300";   // gold
  if (block.type === "INODE_TABLE") return "#1e88e5";  // blue
  if (block.used) return "#4caf50";                    // green (used data)
  return "#2d4a2d";                                    // dark green (free data)
}
```

### 4. Block grid component

**File: `src/components/filesystem/BlockGrid.tsx`**

```tsx
"use client";

import type { DiskBlock } from "@/types/filesystem";
import { blockColor } from "@/lib/colors";

interface Props {
  blocks: DiskBlock[];
}

const BLOCK_LABELS: Record<string, string> = {
  BOOT: "B", SUPERBLOCK: "S", INODE_TABLE: "I",
};

export default function BlockGrid({ blocks }: Props) {
  return (
    <div className="grid grid-cols-16 gap-[2px]">
      {blocks.map(b => (
        <div
          key={b.id}
          className="aspect-square rounded-sm flex items-center justify-center text-[7px] font-mono font-bold transition-colors duration-300 hover:brightness-150"
          style={{ backgroundColor: blockColor(b), color: b.type !== "DATA" ? "#fff" : "transparent" }}
          title={`Block ${b.id} — ${b.type}${b.fileId ? ` — File: ${b.fileId}` : ""}`}
        >
          {b.type !== "DATA" ? BLOCK_LABELS[b.type] : ""}
        </div>
      ))}
    </div>
  );
}
```

### 5. Inode table component

**File: `src/components/filesystem/InodeTable.tsx`**

```tsx
import type { INode } from "@/types/filesystem";

export default function InodeTable({ inodes }: { inodes: INode[] }) {
  return (
    <table className="w-full text-[10px] font-mono mt-2">
      <thead>
        <tr className="text-text-muted uppercase tracking-wider">
          <th className="text-left pr-2">#</th>
          <th className="text-left pr-2">File</th>
          <th className="text-left pr-2">Blocks</th>
          <th className="text-left">Size</th>
        </tr>
      </thead>
      <tbody>
        {inodes.map(inode => (
          <tr key={inode.id} className="border-t border-white/5">
            <td className="py-0.5 pr-2 text-text-muted">{inode.id}</td>
            <td className="py-0.5 pr-2">{inode.used ? inode.fileName : "—"}</td>
            <td className="py-0.5 pr-2">{inode.used ? `[${inode.blocks.join(",")}]` : "—"}</td>
            <td className="py-0.5">{inode.used ? `${inode.size}B` : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 6. FilesystemPanel

**File: `src/components/panels/FilesystemPanel.tsx`**

```tsx
"use client";

import { useSimulation } from "@/hooks/SimulationContext";
import BlockGrid from "../filesystem/BlockGrid";
import InodeTable from "../filesystem/InodeTable";

export default function FilesystemPanel() {
  const { state } = useSimulation();
  const usedBlocks = state.disk.blocks.filter(b => b.type === "DATA" && b.used).length;

  return (
    <section className="rounded-xl bg-white/3 backdrop-blur-xl border border-white/6 p-5
      [border-color:var(--color-accent-filesystem)]/30
      hover:[border-color:var(--color-accent-filesystem)]/60 transition-colors">
      <h2 className="text-xs uppercase tracking-[0.12em] text-text-muted mb-3">Filesystem</h2>
      <div className="text-[10px] font-mono text-text-secondary mb-2">
        Blocks: {usedBlocks}/{122} used
      </div>
      <BlockGrid blocks={state.disk.blocks} />
      <InodeTable inodes={state.disk.inodes} />
    </section>
  );
}
```

### 7. ls/df commands

**File: `src/lib/filesystem.ts`**

```ts
export function ls(disk: DiskState): string {
  const files = disk.inodes.filter(i => i.used);
  if (files.length === 0) return "No files.";
  return files.map(f =>
    `${f.fileName}  blocks=[${f.blocks.join(",")}]  size=${f.size}B`
  ).join("\n");
}

export function df(disk: DiskState): string {
  const totalData = disk.blocks.filter(b => b.type === "DATA").length;
  const usedData = disk.blocks.filter(b => b.type === "DATA" && b.used).length;
  const usedInodes = disk.inodes.filter(i => i.used).length;
  return `Disk: ${usedData}/${totalData} blocks used (${Math.round(usedData/totalData*100)}%)  |  Inodes: ${usedInodes}/${disk.inodes.length}`;
}
```

### 8. Expose commands via context

Add `ls()`, `df()` to `SimulationContext` that delegate to `src/lib/filesystem.ts`.

## Acceptance Criteria
- [ ] Disk grid shows 128 blocks, 16 per row
- [ ] Block 0 = red (B), block 1 = gold (S), blocks 2–5 = blue (I), rest = dark green
- [ ] Inode table shows 4 rows, all empty initially
- [ ] `ls` returns "No files."
- [ ] `df` shows 0/122 blocks used, inodes 0/4

## Files Touched
- `src/types/filesystem.ts` — DiskBlock, INode, DiskState
- `src/lib/filesystem.ts` — createInitialDisk, ls, df
- `src/lib/colors.ts` — blockColor
- `src/components/filesystem/BlockGrid.tsx` — new
- `src/components/filesystem/InodeTable.tsx` — new
- `src/components/panels/FilesystemPanel.tsx` — wire
