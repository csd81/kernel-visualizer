"use client";

import type { INode } from "@/types/filesystem";

interface Props {
  inodes: INode[];
  onHighlight?: (fileName: string | null) => void;
}

export default function InodeTable({ inodes, onHighlight }: Props) {
  return (
    <div className="mt-2">
      <div className="text-[9px] uppercase tracking-wider text-text-muted mb-1">Inodes</div>
      <table className="w-full text-[9px] lg:text-[10px] font-mono">
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
            <tr
              key={inode.id}
              className={`border-t border-white/5 ${inode.used ? "cursor-pointer hover:bg-white/5" : ""}`}
              onMouseEnter={() => onHighlight?.(inode.fileName)}
              onMouseLeave={() => onHighlight?.(null)}
            >
              <td className="py-0.5 pr-2 text-text-muted">{inode.id}</td>
              <td className="py-0.5 pr-2">{inode.used ? inode.fileName : "—"}</td>
              <td className="py-0.5 pr-2">{inode.used ? `[${inode.blocks.join(",")}]` : "—"}</td>
              <td className="py-0.5">{inode.used ? `${inode.size}B` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
