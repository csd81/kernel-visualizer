"use client";

import { useState } from "react";
import { useSimulation } from "@/hooks/SimulationContext";
import BlockGrid from "../filesystem/BlockGrid";
import InodeTable from "../filesystem/InodeTable";
import StatTile from "../shared/StatTile";
import { diskFragPct } from "@/lib/filesystem";

export default function FilesystemPanel() {
  const { state } = useSimulation();
  const [highlightedFile, setHighlightedFile] = useState<string | null>(null);

  const usedBlocks = state.disk.blocks.filter((b) => b.type === "DATA" && b.used).length;
  const totalData = state.disk.blocks.length - 6; // 6 reserved blocks (boot, super, 4 inode)
  const diskPct = Math.round((usedBlocks / totalData) * 100);
  const fragPct = diskFragPct(state.disk.blocks);

  return (
    <section className="rounded-xl bg-white/3 backdrop-blur-xl border border-white/6 p-3 lg:p-5
      [border-color:var(--color-accent-filesystem)]/30
      hover:[border-color:var(--color-accent-filesystem)]/60 transition-colors">
      <h2 className="text-[10px] lg:text-xs uppercase tracking-[0.12em] text-text-muted mb-2 lg:mb-3">
        💾 Filesystem
      </h2>

      <div className="flex gap-2 flex-wrap mb-2">
        <StatTile icon="💾" label="Blocks" value={`${usedBlocks}/${totalData}`} sparkline={state.stats.diskUsage} sparkColor="#ffab00" warn={diskPct > 75} critical={diskPct > 90} />
        <StatTile icon="📉" label="Frag" value={`${fragPct}%`} warn={fragPct > 50} critical={fragPct > 75} />
        <StatTile icon="🗂" label="Files" value={state.disk.inodes.filter(i => i.used).length} />
      </div>

      <BlockGrid blocks={state.disk.blocks} highlightedFile={highlightedFile} />
      <InodeTable inodes={state.disk.inodes} onHighlight={setHighlightedFile} />
    </section>
  );
}
