"use client";

import { useSimulation } from "@/hooks/SimulationContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useState, useEffect, useRef } from "react";

function FpsCounter() {
  const [fps, setFps] = useState(0);
  const frames = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let raf: number;
    const tick = () => {
      frames.current++;
      const now = performance.now();
      if (now - lastTime.current >= 1000) {
        setFps(frames.current);
        frames.current = 0;
        lastTime.current = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <span className="text-[10px] font-mono text-text-muted">{fps} FPS</span>;
}
import Header from "./Header";
import SimulationControls from "./SimulationControls";
import SchedulerPanel from "../panels/SchedulerPanel";
import MemoryPanel from "../panels/MemoryPanel";
import FilesystemPanel from "../panels/FilesystemPanel";
import TerminalPanel from "../panels/TerminalPanel";
import ErrorBoundary from "../shared/ErrorBoundary";

export default function DashboardGrid() {
  const { state, start, stop, setSpeed, loadPreset, resetSim, downloadState } = useSimulation();

  useKeyboardShortcuts({
    "Space": () => state.running ? stop() : start(),
    "+": () => setSpeed(Math.min(2000, state.speed + 50)),
    "=": () => setSpeed(Math.min(2000, state.speed + 50)),
    "-": () => setSpeed(Math.max(50, state.speed - 50)),
  });

  return (
    <div className="min-h-screen p-3 lg:p-5 flex flex-col gap-4">
      <Header tick={state.tick} />
      <SimulationControls
        running={state.running}
        speed={state.speed}
        onStart={start}
        onStop={stop}
        onSpeedChange={setSpeed}
        onLoadPreset={loadPreset}
        onReset={resetSim}
        onDownload={downloadState}
      />
      {state.deadlockedPids.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-sm text-red-400 flex items-center justify-between">
          <span>⚠️ Deadlock detected: PIDs [{state.deadlockedPids.join(", ")}]</span>
          <span className="text-[10px] text-text-muted">Use kill &lt;pid&gt; to resolve</span>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 flex-1 auto-rows-max">
        <ErrorBoundary><SchedulerPanel /></ErrorBoundary>
        <ErrorBoundary><MemoryPanel /></ErrorBoundary>
        <ErrorBoundary><FilesystemPanel /></ErrorBoundary>
        <ErrorBoundary><TerminalPanel /></ErrorBoundary>
      </div>
      <div className="flex items-center justify-between text-[10px] text-text-muted pb-2 px-1">
        <span>SPACE: pause/resume  |  +/-: speed  |  Type &apos;help&apos; in terminal for commands</span>
        <FpsCounter />
      </div>
    </div>
  );
}
