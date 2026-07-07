"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { OutputLine } from "@/types/terminal";

interface Props {
  output: OutputLine[];
  history: string[];
  onCommand: (input: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  input: "text-text-primary",
  output: "text-text-primary",
  info: "text-text-secondary",
  success: "text-green-400",
  error: "text-red-400",
  warning: "text-yellow-400",
};

export default function Terminal({ output, history, onCommand }: Props) {
  const [input, setInput] = useState("");
  const [localHistoryIdx, setLocalHistoryIdx] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      onCommand(input.trim());
      setInput("");
      setLocalHistoryIdx(-1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = Math.min(localHistoryIdx + 1, history.length - 1);
      if (idx >= 0 && history.length > 0) {
        setInput(history[history.length - 1 - idx]);
        setLocalHistoryIdx(idx);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (localHistoryIdx > 0) {
        const idx = localHistoryIdx - 1;
        setInput(history[history.length - 1 - idx]);
        setLocalHistoryIdx(idx);
      } else {
        setInput("");
        setLocalHistoryIdx(-1);
      }
    }
  }, [input, onCommand, history, localHistoryIdx]);

  return (
    <div
      className="h-full flex flex-col font-mono text-xs lg:text-sm bg-black rounded-lg overflow-hidden cursor-text"
      style={{ caretColor: "#33ff33" }}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="relative flex-1 flex flex-col crt-glow">
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)" }}
        />
        <div ref={outputRef} className="flex-1 overflow-y-auto p-2 lg:p-3 space-y-0.5 relative z-0">
          {output.map(line => (
            <div key={line.id} className={`${TYPE_COLORS[line.type]} whitespace-pre-wrap break-all leading-normal`}>
              {line.type === "input" ? <span className="text-green-400">$ </span> : ""}
              {line.text}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 p-1.5 lg:p-2 border-t border-white/10">
          <span className="text-green-400 shrink-0">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-green-400 text-xs lg:text-sm min-h-[24px]"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
