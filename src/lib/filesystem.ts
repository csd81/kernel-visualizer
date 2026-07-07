import type { DiskState, DiskBlock } from "@/types/filesystem";
import { createInitialDiskState } from "./sim";

export const BLOCK_SIZE = 512;
export const TOTAL_INODES = 4;

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
  return `Disk: ${usedData}/${totalData} blocks used (${Math.round(usedData / totalData * 100)}%)  |  Inodes: ${usedInodes}/${disk.inodes.length}`;
}

export function createFile(disk: DiskState, fileName: string, numBlocks: number):
  { disk: DiskState; message: string } {
  if (!fileName || fileName.trim() === "") return { disk, message: "Error: invalid filename" };
  if (disk.inodes.some(i => i.fileName === fileName)) return { disk, message: `Error: '${fileName}' already exists` };

  const inodeIdx = disk.inodes.findIndex(i => !i.used);
  if (inodeIdx === -1) return { disk, message: "Error: no free inodes (max 4 files)" };

  const freeBlocks = disk.blocks
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => b.type === "DATA" && !b.used);
  if (freeBlocks.length < numBlocks) return { disk, message: `Error: disk full (${freeBlocks.length} free blocks, need ${numBlocks})` };

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
  return { disk: { ...disk, blocks, inodes }, message: `Created '${fileName}' (${numBlocks} blocks, inode ${inodeIdx}, ${numBlocks * BLOCK_SIZE}B)` };
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
