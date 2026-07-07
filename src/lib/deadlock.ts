import type { Process } from "@/types/process";

export function detectDeadlock(processes: Process[]): number[] {
  const graph = new Map<number, number>();
  for (const p of processes) {
    if (p.waitsFor !== -1) {
      graph.set(p.pid, p.waitsFor);
    }
  }

  const visited = new Set<number>();
  const inStack = new Set<number>();
  const deadlocked: Set<number> = new Set();

  function dfs(pid: number): boolean {
    if (inStack.has(pid)) return true;
    if (visited.has(pid)) return false;
    visited.add(pid);
    inStack.add(pid);

    const next = graph.get(pid);
    if (next !== undefined && dfs(next)) {
      deadlocked.add(pid);
      deadlocked.add(next);
      inStack.delete(pid);
      return true;
    }

    inStack.delete(pid);
    return false;
  }

  for (const pid of graph.keys()) {
    if (!visited.has(pid)) dfs(pid);
  }

  return [...deadlocked];
}
