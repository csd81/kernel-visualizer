import type { Process, ProcessState } from "@/types/process";
import type { SimState } from "@/types/sim";
import { processColor } from "./colors";

const MAX_PID = 1024;

// ─── Process creation ────────────────────────────────────────────────

export function createProcess(pid: number, ticks: number, priority: number, currentTick: number): Process {
  return {
    pid,
    state: "READY",
    totalTicks: ticks,
    remainingTicks: ticks,
    priority: Math.max(0, Math.min(9, priority)),
    readyTick: currentTick,
    totalRunTicks: 0,
    currentQuantumTicks: 0,
    ticksSinceRun: 0,
    blockedTick: 0,
    mlfqLevel: 0,
    color: processColor(pid),
    pageTable: [],
    holds: [],
    waitsFor: -1,
  };
}

// ─── Fork / Kill ─────────────────────────────────────────────────────

export function fork(state: SimState, ticks: number, priority: number): { state: SimState; message: string } {
  if (state.processes.length >= MAX_PID) return { state, message: "Error: maximum processes reached" };
  const pid = state.nextPid;
  const nextPidVal = (pid % MAX_PID) + 1;
  const proc = createProcess(
    pid,
    Math.max(1, Math.min(100, isNaN(ticks) ? 10 : ticks)),
    Math.max(0, Math.min(9, isNaN(priority) ? 0 : priority)),
    state.tick
  );
  return {
    state: { ...state, nextPid: nextPidVal, processes: [...state.processes, proc] },
    message: `Created PID ${proc.pid} (${proc.totalTicks} ticks, pri ${proc.priority})`,
  };
}

export function kill(state: SimState, pid: number): { state: SimState; message: string } {
  const idx = state.processes.findIndex(p => p.pid === pid);
  if (idx === -1) return { state, message: `Error: unknown PID ${pid}` };
  const proc = state.processes[idx];
  if (proc.state === "TERMINATED") return { state, message: `Error: PID ${pid} already terminated` };
  const processes = state.processes.map(p =>
    p.pid === pid ? { ...p, state: "TERMINATED" as ProcessState, terminatedTick: state.tick } : p
  );
  return { state: { ...state, processes }, message: `PID ${pid} terminated` };
}

export function renice(state: SimState, pid: number, newPriority: number): { state: SimState; message: string } {
  const proc = state.processes.find(p => p.pid === pid);
  if (!proc) return { state, message: `Error: unknown PID ${pid}` };
  if (proc.state === "TERMINATED") return { state, message: `Error: PID ${pid} is terminated` };
  const clamped = Math.max(0, Math.min(9, newPriority));
  const processes = state.processes.map(p =>
    p.pid === pid ? { ...p, priority: clamped } : p
  );
  return { state: { ...state, processes }, message: `PID ${pid} priority set to ${clamped}` };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getReady(processes: Process[]): Process[] {
  return processes.filter(p => p.state === "READY");
}

function pickupNext(processes: Process[]): number | null {
  const ready = getReady(processes);
  if (ready.length === 0) return null;
  return ready.sort((a, b) => a.readyTick - b.readyTick)[0].pid;
}

function incrementTicksSinceRun(processes: Process[]): Process[] {
  return processes.map(p =>
    p.state === "READY" ? { ...p, ticksSinceRun: p.ticksSinceRun + 1 } : p
  );
}

function setRunning(processes: Process[], pid: number): Process[] {
  return processes.map(p =>
    p.pid === pid ? { ...p, state: "RUNNING" as ProcessState, currentQuantumTicks: 0 } : p
  );
}

/** Patch duration onto the most recent "scheduled" history entry for a PID. */
function patchDuration(history: SimState["history"], pid: number, currentTick: number): SimState["history"] {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].pid === pid && history[i].event === "scheduled") {
      const updated = { ...history[i], duration: currentTick - history[i].tick };
      return history.map((h, idx) => (idx === i ? updated : h));
    }
  }
  return history;
}

// ─── FCFS ────────────────────────────────────────────────────────────

export function scheduleFcfs(state: SimState): SimState {
  let processes = incrementTicksSinceRun(state.processes);
  let contextSwitches = state.stats.contextSwitches;
  let history = [...state.history];

  const runningIdx = processes.findIndex(p => p.state === "RUNNING");

  if (runningIdx !== -1) {
    const p = processes[runningIdx];
    const updated = { ...p, remainingTicks: p.remainingTicks - 1, totalRunTicks: p.totalRunTicks + 1 };
    if (updated.remainingTicks <= 0) {
      updated.state = "TERMINATED";
      updated.terminatedTick = state.tick;
      history = patchDuration(history, updated.pid, state.tick);
      history.push({ tick: state.tick, pid: updated.pid, event: "terminated" });
    }
    processes = [...processes];
    processes[runningIdx] = updated;
    if (updated.state !== "TERMINATED") {
      return { ...state, processes, history, stats: { ...state.stats, contextSwitches } };
    }
  }

  const nextPid = pickupNext(processes);
  if (nextPid === null) return { ...state, processes, history, stats: { ...state.stats, contextSwitches } };
  processes = setRunning(processes, nextPid);
  contextSwitches++;
  history.push({ tick: state.tick, pid: nextPid, event: "scheduled" });
  return { ...state, processes, history, stats: { ...state.stats, contextSwitches } };
}

// ─── Round Robin ─────────────────────────────────────────────────────

export function scheduleRr(state: SimState): SimState {
  let processes = incrementTicksSinceRun(state.processes);
  let contextSwitches = state.stats.contextSwitches;
  let history = [...state.history];

  const runningIdx = processes.findIndex(p => p.state === "RUNNING");

  if (runningIdx !== -1) {
    const p = processes[runningIdx];
    const updated = {
      ...p,
      remainingTicks: p.remainingTicks - 1,
      totalRunTicks: p.totalRunTicks + 1,
      currentQuantumTicks: p.currentQuantumTicks + 1,
    };

    if (updated.remainingTicks <= 0) {
      updated.state = "TERMINATED";
      updated.terminatedTick = state.tick;
      history = patchDuration(history, updated.pid, state.tick);
      history.push({ tick: state.tick, pid: updated.pid, event: "terminated" });
    } else if (updated.currentQuantumTicks >= state.quantum) {
      updated.state = "READY";
      updated.readyTick = state.tick;
      updated.currentQuantumTicks = 0;
      history = patchDuration(history, updated.pid, state.tick);
      history.push({ tick: state.tick, pid: updated.pid, event: "preempted" });
    }

    processes = [...processes];
    processes[runningIdx] = updated;
    if (updated.state === "RUNNING") {
      return { ...state, processes, history, stats: { ...state.stats, contextSwitches } };
    }
  }

  const nextPid = pickupNext(processes);
  if (nextPid === null) return { ...state, processes, history, stats: { ...state.stats, contextSwitches } };
  processes = setRunning(processes, nextPid);
  contextSwitches++;
  history.push({ tick: state.tick, pid: nextPid, event: "scheduled" });
  return { ...state, processes, history, stats: { ...state.stats, contextSwitches } };
}

// ─── Priority (Preemptive) ───────────────────────────────────────────

export function schedulePriority(state: SimState): SimState {
  let processes = incrementTicksSinceRun(state.processes);
  let contextSwitches = state.stats.contextSwitches;
  let history = [...state.history];

  const runningIdx = processes.findIndex(p => p.state === "RUNNING");

  if (runningIdx !== -1) {
    const running = processes[runningIdx];
    const higherPrio = getReady(processes)
      .filter(p => p.priority > running.priority)
      .sort((a, b) => b.priority - a.priority || a.readyTick - b.readyTick);

    if (higherPrio.length > 0) {
      history = patchDuration(history, running.pid, state.tick);
      history.push({ tick: state.tick, pid: running.pid, event: "preempted" });
      processes = [...processes];
      processes[runningIdx] = {
        ...running,
        state: "READY" as ProcessState,
        readyTick: state.tick,
        currentQuantumTicks: 0,
      };
      const nextPid = higherPrio[0].pid;
      processes = setRunning(processes, nextPid);
      contextSwitches++;
      history.push({ tick: state.tick, pid: nextPid, event: "scheduled" });
      return { ...state, processes, history, stats: { ...state.stats, contextSwitches } };
    }

    const updated = {
      ...running,
      remainingTicks: running.remainingTicks - 1,
      totalRunTicks: running.totalRunTicks + 1,
    };
    if (updated.remainingTicks <= 0) {
      updated.state = "TERMINATED";
      updated.terminatedTick = state.tick;
      history = patchDuration(history, updated.pid, state.tick);
      history.push({ tick: state.tick, pid: updated.pid, event: "terminated" });
    }
    processes = [...processes];
    processes[runningIdx] = updated;
    if (updated.state !== "TERMINATED") {
      return { ...state, processes, history, stats: { ...state.stats, contextSwitches } };
    }
  }

  const nextPid = pickupNext(processes);
  if (nextPid === null) return { ...state, processes, history, stats: { ...state.stats, contextSwitches } };
  processes = setRunning(processes, nextPid);
  contextSwitches++;
  history.push({ tick: state.tick, pid: nextPid, event: "scheduled" });
  return { ...state, processes, history, stats: { ...state.stats, contextSwitches } };
}

// ─── MLFQ ────────────────────────────────────────────────────────────

const MLFQ_QUANTA = [2, 5, 12];

export function scheduleMlfq(state: SimState): SimState {
  let processes = incrementTicksSinceRun(state.processes);
  let contextSwitches = state.stats.contextSwitches;
  let history = [...state.history];

  let ticksSinceBoost = state.ticksSinceBoost + 1;
  if (ticksSinceBoost >= 50) {
    processes = processes.map(p => (p.state !== "TERMINATED" ? { ...p, mlfqLevel: 0 } : p));
    ticksSinceBoost = 0;
  }

  const runningIdx = processes.findIndex(p => p.state === "RUNNING");

  if (runningIdx !== -1) {
    const p = processes[runningIdx];
    const updated = {
      ...p,
      remainingTicks: p.remainingTicks - 1,
      totalRunTicks: p.totalRunTicks + 1,
      currentQuantumTicks: p.currentQuantumTicks + 1,
    };

    const levelQuantum = MLFQ_QUANTA[updated.mlfqLevel] ?? MLFQ_QUANTA[2];

    if (updated.remainingTicks <= 0) {
      updated.state = "TERMINATED";
      updated.terminatedTick = state.tick;
      history = patchDuration(history, updated.pid, state.tick);
      history.push({ tick: state.tick, pid: updated.pid, event: "terminated" });
    } else if (updated.currentQuantumTicks >= levelQuantum) {
      updated.mlfqLevel = Math.min(2, updated.mlfqLevel + 1);
      updated.state = "READY";
      updated.readyTick = state.tick;
      updated.currentQuantumTicks = 0;
      history = patchDuration(history, updated.pid, state.tick);
      history.push({ tick: state.tick, pid: updated.pid, event: "preempted" });
    }

    processes = [...processes];
    processes[runningIdx] = updated;
    if (updated.state === "RUNNING") {
      return { ...state, processes, ticksSinceBoost, history, stats: { ...state.stats, contextSwitches } };
    }
  }

  const ready = getReady(processes);
  if (ready.length === 0) {
    return { ...state, processes, ticksSinceBoost, history, stats: { ...state.stats, contextSwitches } };
  }
  const nextPid = ready.sort((a, b) => a.mlfqLevel - b.mlfqLevel || a.readyTick - b.readyTick)[0].pid;
  processes = setRunning(processes, nextPid);
  contextSwitches++;
  history.push({ tick: state.tick, pid: nextPid, event: "scheduled" });
  return { ...state, processes, ticksSinceBoost, history, stats: { ...state.stats, contextSwitches } };
}

// ─── Dispatcher ──────────────────────────────────────────────────────

export function schedule(state: SimState): SimState {
  switch (state.scheduler) {
    case "rr":       return scheduleRr(state);
    case "priority": return schedulePriority(state);
    case "mlfq":     return scheduleMlfq(state);
    default:         return scheduleFcfs(state);
  }
}
