"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { SimState } from "@/types/sim";
import { createInitialState, tick as simTick } from "@/lib/sim";
import { processShellCommand } from "@/lib/terminal";
import { schedule } from "@/lib/scheduler";
import { detectDeadlock } from "@/lib/deadlock";
import { loadPreset, exportState } from "@/lib/presets";
import type { SchedAlgorithm } from "@/types/sim";
import { addLine } from "@/lib/terminal-parser";
import { resolvePageFault } from "@/lib/memory";

export function useSimulation() {
  const [state, setState] = useState<SimState>(createInitialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doTick = useCallback(() => {
    setState(prev => {
      let next = { ...simTick(prev) };
      next = { ...next, memory: { ...next.memory, faultFlash: false } };
      next = schedule(next);
      next = resolveBlockedProcesses(next);
      next = applyCleanup(next);
      // Stats
      const running = next.processes.some(p => p.state === "RUNNING");
      const cpuPct = running ? 100 : 0;
      const usedMem = next.memory.frames.filter(f => f.pid !== null).length;
      const usedDisk = next.disk.blocks.filter(b => b.type === "DATA" && b.used).length;
      next.stats = {
        ...next.stats,
        cpuUtil: [...next.stats.cpuUtil.slice(-99), cpuPct],
        memoryPressure: [...next.stats.memoryPressure.slice(-99), Math.round(usedMem / 256 * 100)],
        diskUsage: [...next.stats.diskUsage.slice(-99), Math.round(usedDisk / 122 * 100)],
      };
      // Deadlock detection
      const deadlocked = detectDeadlock(next.processes);
      if (deadlocked.length > 0 && prev.deadlockedPids.length === 0) {
        next.terminal.output = addLine(next.terminal.output, `⚠️ DEADLOCK DETECTED: PIDs [${deadlocked.join(", ")}]`, "warning");
      }
      next.deadlockedPids = deadlocked;
      return next;
    });
  }, []);

  const start = useCallback(() => setState(prev => prev.running ? prev : { ...prev, running: true }), []);
  const stop = useCallback(() => setState(prev => !prev.running ? prev : { ...prev, running: false }), []);
  const setSpeed = useCallback((ms: number) => setState(prev => ({ ...prev, speed: Math.max(50, Math.min(2000, ms)) })), []);
  const setScheduler = useCallback((s: SchedAlgorithm) => setState(prev => ({ ...prev, scheduler: s })), []);
  const setQuantum = useCallback((q: number) => setState(prev => ({ ...prev, quantum: Math.max(1, Math.min(20, q)) })), []);
  const setMemAlgorithm = useCallback((a: "first-fit" | "best-fit") => setState(prev => ({
    ...prev, memory: { ...prev.memory, algorithm: a }
  })), []);

  const processCommand = useCallback((input: string) => {
    setState(prev => {
      const next = processShellCommand(prev, input);
      // Update terminal history
      const history = [...next.terminal.history, input].slice(-100);
      return { ...next, terminal: { ...next.terminal, history, historyIndex: -1 } };
    });
  }, []);

  const loadPresetAction = useCallback((name: "empty" | "cpu-demo" | "memory-pressure" | "disk-frag" | "deadlock") => {
    setState(prev => loadPreset(prev, name));
  }, []);

  const resetSim = useCallback(() => {
    setState(createInitialState());
  }, []);

  const downloadState = useCallback(() => {
    setState(prev => {
      const json = exportState(prev);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `kernel-state-${prev.tick}.json`; a.click();
      URL.revokeObjectURL(url);
      return prev;
    });
  }, []);

  // Interval management
  useEffect(() => {
    if (state.running) {
      intervalRef.current = setInterval(doTick, state.speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.running, state.speed, doTick]);

  return {
    state, start, stop, setSpeed, setScheduler, setQuantum,
    setMemAlgorithm, processCommand, loadPreset: loadPresetAction,
    resetSim, downloadState,
  };
}

function resolveBlockedProcesses(state: SimState): SimState {
  // Auto-resolve BLOCKED processes that have been blocked for 3+ ticks
  let next = state;
  for (const proc of state.processes) {
    if (proc.state === "BLOCKED" && state.tick - proc.blockedTick >= 3) {
      next = resolvePageFault(next, proc.pid);
    }
  }
  return next;
}

function applyCleanup(state: SimState): SimState {
  // Remove TERMINATED processes older than 3 ticks
  return {
    ...state,
    processes: state.processes.filter(p => {
      if (p.state === "TERMINATED") {
        return p.terminatedTick === undefined || state.tick - p.terminatedTick < 3;
      }
      return true;
    }),
  };
}
