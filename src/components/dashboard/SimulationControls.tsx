"use client";

interface Props {
  running: boolean;
  speed: number;
  viewTick: number;
  onStart: () => void;
  onStop: () => void;
  onSpeedChange: (ms: number) => void;
  onLoadPreset: (name: "empty" | "cpu-demo" | "memory-pressure" | "disk-frag" | "deadlock") => void;
  onReset: () => void;
  onDownload: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onBackToLive: () => void;
}

export default function SimulationControls({
  running, speed, viewTick, onStart, onStop, onSpeedChange,
  onLoadPreset, onReset, onDownload, onStepForward, onStepBack, onBackToLive,
}: Props) {
  const isScrubbing = viewTick >= 0;

  return (
    <div className="flex items-center flex-wrap gap-2 lg:gap-3 px-1 lg:px-2">
      <button
        onClick={running ? onStop : onStart}
        className="px-3 lg:px-4 py-1.5 text-xs lg:text-sm rounded-lg bg-white/6 border border-white/10 hover:bg-white/10 transition-colors font-mono"
      >
        {running ? "⏸ Pause" : "▶ Play"}
      </button>

      <button
        onClick={onStepBack}
        disabled={isScrubbing && viewTick <= 0}
        className="px-2 py-1.5 text-xs rounded-lg bg-white/6 border border-white/10 hover:bg-white/10 transition-colors font-mono disabled:opacity-30 disabled:cursor-not-allowed"
        title="Step backward"
      >
        ⏪
      </button>
      <button
        onClick={onStepForward}
        className="px-2 py-1.5 text-xs rounded-lg bg-white/6 border border-white/10 hover:bg-white/10 transition-colors font-mono"
        title="Step forward one tick"
      >
        ⏩
      </button>

      {isScrubbing && (
        <>
          <span className="text-[10px] text-yellow-400 font-mono">
            📍 Viewing tick {viewTick}
          </span>
          <button
            onClick={onBackToLive}
            className="text-[10px] text-cyan-400 hover:underline font-mono"
          >
            ⬅ Back to Live
          </button>
        </>
      )}

      <label className="flex items-center gap-1.5 lg:gap-2 text-[10px] lg:text-xs text-text-secondary">
        Speed
        <input
          type="range" min={50} max={2000} value={speed}
          onChange={e => onSpeedChange(Number(e.target.value))}
          className="w-16 lg:w-24 accent-cyan-400"
        />
        <span className="font-mono text-[10px] text-text-muted w-10 lg:w-12">{speed}ms</span>
      </label>

      <select
        defaultValue=""
        onChange={e => {
          if (e.target.value) onLoadPreset(e.target.value as "empty" | "cpu-demo" | "memory-pressure" | "disk-frag" | "deadlock");
        }}
        className="bg-white/6 border border-white/10 rounded px-1.5 lg:px-2 py-1 text-[10px] lg:text-xs font-mono text-text-primary"
      >
        <option value="">Load Preset…</option>
        <option value="empty">Empty</option>
        <option value="cpu-demo">CPU Demo</option>
        <option value="memory-pressure">Memory Pressure</option>
        <option value="disk-frag">Disk Frag</option>
        <option value="deadlock">Deadlock</option>
      </select>

      <button onClick={onDownload} className="text-[10px] lg:text-xs text-text-muted hover:text-text-secondary transition-colors">
        💾 Save
      </button>
      <button onClick={onReset} className="text-[10px] lg:text-xs text-text-muted hover:text-red-400 transition-colors">
        ↺ Reset
      </button>
    </div>
  );
}
