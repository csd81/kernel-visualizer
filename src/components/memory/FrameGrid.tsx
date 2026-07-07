"use client";

import React from "react";
import type { Frame } from "@/types/memory";
import { processColor } from "@/lib/colors";

interface Props {
  frames: Frame[];
  onSelect: (frame: Frame) => void;
  flash?: boolean;
}

function FrameGridInner({ frames, onSelect, flash }: Props) {
  return (
    <div className={`grid grid-cols-8 sm:grid-cols-16 gap-[2px] ${flash ? "animate-page-fault" : ""}`}>
      {frames.map(f => (
        <button
          key={f.id}
          onClick={() => onSelect(f)}
          className="aspect-square rounded-sm text-[5px] lg:text-[6px] font-mono transition-all duration-200 hover:brightness-150 hover:scale-110 cursor-pointer border-0 min-w-[20px] min-h-[20px] sm:min-w-[24px] sm:min-h-[24px]"
          style={{
            backgroundColor: f.pid !== null ? processColor(f.pid) : "#2a2a35",
          }}
          title={`Frame ${f.id} — ${f.pid !== null ? `PID ${f.pid}` : "free"}`}
        />
      ))}
    </div>
  );
}

export default React.memo(FrameGridInner, (prev, next) => prev.frames === next.frames && prev.flash === next.flash);
