"use client";

import React from "react";
import type { DiskBlock } from "@/types/filesystem";
import { blockColor } from "@/lib/colors";

interface Props {
  blocks: DiskBlock[];
  highlightedFile?: string | null;
}

const BLOCK_LABELS: Record<string, string> = { BOOT: "B", SUPERBLOCK: "S", INODE_TABLE: "I" };

function BlockGridInner({ blocks, highlightedFile }: Props) {
  return (
    <div className="grid grid-cols-16 gap-[2px]">
      {blocks.map(b => {
        const highlight = highlightedFile && b.fileId === highlightedFile;
        return (
          <div
            key={b.id}
            className={`aspect-square rounded-sm flex items-center justify-center text-[6px] lg:text-[7px] font-mono font-bold transition-all duration-300 hover:brightness-150 ${highlight ? "ring-1 ring-yellow-400" : ""}`}
            style={{ backgroundColor: blockColor(b), color: b.type !== "DATA" ? "#fff" : "transparent" }}
            title={`Block ${b.id} — ${b.type}${b.fileId ? ` — File: ${b.fileId}` : ""}`}
          >
            {b.type !== "DATA" ? BLOCK_LABELS[b.type] : b.fileId ? "‧" : ""}
          </div>
        );
      })}
    </div>
  );
}

export default React.memo(BlockGridInner, (prev, next) => prev.blocks === next.blocks && prev.highlightedFile === next.highlightedFile);
