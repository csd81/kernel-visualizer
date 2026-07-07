import type { Process, ProcessState } from "@/types/process";
import type { SimState } from "@/types/sim";
import { processColor } from "./colors";

let nextPid = 1;
const MAX_PID = 1024;

function getNextPid(): number {
  const pid = nextPid;
  nextPid = (nextPid % MAX_PID) + 1;
  return pid;
}

export function createProcess(ticks: number, priority: number): Process {
  const pid = getNextPid();
  return {
    pid,
    state: "READY",
    totalTicks: ticks,
    remainingTicks: ticks,
    priority: Math.max(0, Math.min(9, priority)),
    arrivalTick: 0,
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

export function fork(state: SimState, ticks: number, priority: number): { state: SimState; message: string } {
  if (state.processes.length >= MAX_PID) {
    return { state, message: "Error: maximum processes reached" };
  }
  const proc = createProcess(
    Math.max(1, Math.min(100, ticks || 10)),
    Math.max(0, Math.min(9, priority || 0))
  );
  proc.arrivalTick = state.tick;
  return {
    state: { ...state, processes: [...state.processes, proc] },
    message: `Created PID ${proc.pid} (${proc.totalTicks} ticks, pri ${proc.priority})`,
  };
}

export function kill(state: SimState, pid: number): { state: SimState; message: string } {
  const idx = state.processes.findIndex(p => p.pid === pid);
  if (idx === -1) return { state, message: `Error: unknown PID ${pid}` };
  const proc = state.processes[idx];
  if (proc.state === "TERMINATED") return { state, message: `Error: PID ${pid} already terminated` };
  const processes = state.processes.map(p =>
    p.pid === pid ? { ...p, state: "TERMINATED" as ProcessState } : p
  );
  return { state: { ...state, processes }, message: `PID ${pid} terminated` };
}

export function scheduleFcfs(state: SimState): SimState {
  let contextSwitches = state.stats.contextSwitches;
  let history = [...state.history];

  const running = state.processes.find(p => p.state === "RUNNING");
  if (running) {
    const processes = state.processes.map(p => {
      if (p.pid !== running.pid) return p;
      const next = { ...p, remainingTicks: p.remainingTicks - 1, totalRunTicks: p.totalRunTicks + 1 };
      if (next.remainingTicks <= 0) {
        next.state = "TERMINATED";
        history.push({ tick: state.tick, pid: next.pid, event: "terminated" });
      }
      return next;
    });
    return { ...state, processes, history, stats: { ...state.stats, contextSwitches } };
  }

  const next = state.processes
    .filter(p => p.state === "READY")
    .sort((a, b) => a.arrivalTick - b.arrivalTick)[0];

  if (next) {
    const processes = state.processes.map(p =>
      p.pid === next.pid ? { ...p, state: "RUNNING" as ProcessState } : p
    );
    contextSwitches++;
    history.push({ tick: state.tick, pid: next.pid, event: "scheduled" });
    return { ...state, processes, history, stats: { ...state.stats, contextSwitches } };
  }

  return state;
}
