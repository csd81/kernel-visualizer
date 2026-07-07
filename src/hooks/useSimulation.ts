"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { SimState } from "@/types/sim";
import { createInitialState, tick as simTick, reconstructStateAt } from "@/lib/sim";
import { processShellCommand } from "@/lib/terminal";
import { schedule, retryBlockedProcesses } from "@/lib/scheduler";
import { detectDeadlock } from "@/lib/deadlock";
import { loadPreset, exportState } from "@/lib/presets";
import type { SchedAlgorithm } from "@/types/sim";
import { addLine } from "@/lib/terminal-parser";
import { resolvePageFault } from "@/lib/memory";

export function useSimulation() {
  const [state, setState] = useState<SimState>(createInitialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialStateRef = useRef<SimState>(createInitialState());

  // ─── View / Scrub state ──────────────────────────────────────────

  const [viewTick, setViewTickState] = useState(-1);
  const [reconstructedState, setReconstructedState] = useState<SimState | null>(null);
  const snapshotCache = useRef(new Map<number, SimState>());

  const setViewTick = useCallback((tick: number) => {
    if (tick === -1) {
      setViewTickState(-1);
      setReconstructedState(null);
      return;
    }

    // Check cache
    let snapshot = snapshotCache.current.get(tick);
    if (!snapshot) {
      snapshot = reconstructStateAt(initialStateRef.current, state.history, tick);
      snapshotCache.current.set(tick, snapshot);
    }

    setViewTickState(tick);
    setReconstructedState(snapshot);
    // Pause when scrubbing
    setState(prev => ({ ...prev, running: false, viewTick: tick }));
  }, [state.history]);

  const stepForward = useCallback(() => {
    setState(prev => {
      let next = { ...simTick(prev) };
      next = { ...next, memory: { ...next.memory, faultFlash: false } };
      next = schedule(next);
      next = retryBlockedProcesses(next);
      next = resolveBlockedProcesses(next);
      next = applyCleanup(next);
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
      if (next.history.length > 500) next.history = next.history.slice(-500);
      const deadlocked = detectDeadlock(next.processes);
      if (deadlocked.length > 0 && prev.deadlockedPids.length === 0) {
        next.terminal.output = addLine(next.terminal.output, `⚠️ DEADLOCK DETECTED: PIDs [${deadlocked.join(", ")}]`, "warning");
      }
      next.deadlockedPids = deadlocked;
      next.viewTick = -1;
      return next;
    });
    setViewTickState(-1);
    setReconstructedState(null);
  }, []);

  // ─── Tick loop ───────────────────────────────────────────────────

  const doTick = useCallback(() => {
    setState(prev => {
      let next = { ...simTick(prev) };
      next = { ...next, memory: { ...next.memory, faultFlash: false } };
      next = schedule(next);
      next = retryBlockedProcesses(next);
      next = resolveBlockedProcesses(next);
      next = applyCleanup(next);
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
      if (next.history.length > 500) next.history = next.history.slice(-500);
      const deadlocked = detectDeadlock(next.processes);
      if (deadlocked.length > 0 && prev.deadlockedPids.length === 0) {
        next.terminal.output = addLine(next.terminal.output, `⚠️ DEADLOCK DETECTED: PIDs [${deadlocked.join(", ")}]`, "warning");
      }
      next.deadlockedPids = deadlocked;
      next.viewTick = -1;
      return next;
    });
  }, []);

  // ─── Standard actions ────────────────────────────────────────────

  const start = useCallback(() => {
    setState(prev => ({ ...prev, running: true, viewTick: -1 }));
    setViewTickState(-1);
    setReconstructedState(null);
  }, []);

  const stop = useCallback(() => setState(prev => !prev.running ? prev : { ...prev, running: false }), []);
  const setSpeed = useCallback((ms: number) => setState(prev => ({ ...prev, speed: Math.max(50, Math.min(2000, ms)) })), []);
  const setScheduler = useCallback((s: SchedAlgorithm) => setState(prev => ({ ...prev, scheduler: s })), []);
  const setQuantum = useCallback((q: number) => setState(prev => ({ ...prev, quantum: Math.max(1, Math.min(20, q)) })), []);
  const setAgingThreshold = useCallback((t: number) => setState(prev => ({ ...prev, agingThreshold: Math.max(5, Math.min(100, t)) })), []);
  const setMemAlgorithm = useCallback((a: "first-fit" | "best-fit") => setState(prev => ({
    ...prev, memory: { ...prev.memory, algorithm: a }
  })), []);

  const processCommand = useCallback((input: string) => {
    setState(prev => {
      const next = processShellCommand(prev, input);
      const history = [...next.terminal.history, input].slice(-100);
      return { ...next, terminal: { ...next.terminal, history, historyIndex: -1 } };
    });
  }, []);

  const loadPresetAction = useCallback((name: "empty" | "cpu-demo" | "memory-pressure" | "disk-frag" | "deadlock") => {
    setState(prev => loadPreset(prev, name));
    setViewTickState(-1);
    setReconstructedState(null);
  }, []);

  const resetSim = useCallback(() => {
    setState(createInitialState());
    setViewTickState(-1);
    setReconstructedState(null);
    snapshotCache.current.clear();
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

  // ─── Terminal history persistence ─────────────────────────────────

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("kv-terminal-history");
      if (saved) {
        const history = JSON.parse(saved);
        if (Array.isArray(history)) {
          setState(prev => ({ ...prev, terminal: { ...prev.terminal, history } }));
        }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("kv-terminal-history", JSON.stringify(state.terminal.history));
    } catch { /* ignore */ }
  }, [state.terminal.history]);

  // ─── Interval management ─────────────────────────────────────────

  useEffect(() => {
    if (state.running) {
      intervalRef.current = setInterval(doTick, state.speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.running, state.speed, doTick]);

  // ─── Display state: reconstructed when scrubbing, live otherwise ─

  const displayState = reconstructedState ?? state;

  return {
    state: displayState,
    liveState: state,
    start, stop, setSpeed, setScheduler, setQuantum, setAgingThreshold,
    setMemAlgorithm, processCommand, loadPreset: loadPresetAction,
    resetSim, downloadState, setViewTick, stepForward,
  };
}

function resolveBlockedProcesses(state: SimState): SimState {
  let next = state;
  for (const proc of state.processes) {
    if (proc.state === "BLOCKED" && state.tick - proc.blockedTick >= 3) {
      next = resolvePageFault(next, proc.pid);
    }
  }
  return next;
}

function applyCleanup(state: SimState): SimState {
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
