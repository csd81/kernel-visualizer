const PROCESS_PALETTE = [
  "#00e5ff", "#76ff03", "#ffea00", "#ff3d00",
  "#d500f9", "#ff9100", "#00e676", "#ea80fc",
  "#18ffff", "#ff6e40",
];

export function processColor(pid: number): string {
  return PROCESS_PALETTE[pid % PROCESS_PALETTE.length];
}

import type { DiskBlock } from "@/types/filesystem";

export function blockColor(block: DiskBlock): string {
  if (block.type === "BOOT") return "#e53935";
  if (block.type === "SUPERBLOCK") return "#ffb300";
  if (block.type === "INODE_TABLE") return "#1e88e5";
  if (block.used) return "#4caf50";
  return "#2d4a2d";
}
