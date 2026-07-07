import type { SimState } from "@/types/sim";
import { parseCommand } from "./terminal-parser";
import { fork, kill, renice } from "./scheduler";
import { allocateFrames, freeProcessFrames, simulatePageFault, buildPageTable } from "./memory";
import { createFile, deleteFile, ls, df } from "./filesystem";
import { addLine } from "./terminal-parser";

export function processShellCommand(state: SimState, input: string): SimState {
  const { cmd, args } = parseCommand(input);
  let output = addLine(state.terminal.output, input, "input");
  const next: SimState = { ...state, terminal: { ...state.terminal, output } };

  switch (cmd) {
    case "help": {
      const helpText = [
        "Available commands:",
        "  fork <ticks> <priority>   — Create a process",
        "  kill <pid>                — Terminate a process",
        "  renice <pid> <pri>        — Change process priority",
        "  ps                        — List processes",
        "  alloc <pid> <size_kb>     — Allocate memory frames",
        "  free <pid>                — Free all memory for PID",
        "  pfault <pid> <page>       — Simulate a page fault",
        "  create <name> <blocks>    — Create a file on disk",
        "  rm <name>                 — Delete a file",
        "  ls                        — List files",
        "  df                        — Disk usage / inodes",
        "  speed <ms>                — Set tick speed (50–2000ms)",
        "  pause                     — Pause simulation",
        "  resume                    — Resume simulation",
        "  clear                     — Clear terminal",
        "  help                      — Show this message",
      ].join("\n");
      output = addLine(output, helpText, "info");
      return { ...next, terminal: { ...next.terminal, output } };
    }

    case "fork": {
      const ticks = parseInt(args[0]), priority = parseInt(args[1]);
      if (isNaN(ticks)) return { ...next, terminal: { ...next.terminal, output: addLine(output, "Usage: fork <ticks> <priority>", "error") } };
      const result = fork(next, ticks, isNaN(priority) ? 0 : priority);
      output = addLine(output, result.message, result.message.startsWith("Created") ? "success" : "error");
      return { ...result.state, terminal: { ...result.state.terminal, output } };
    }

    case "kill": {
      const pid = parseInt(args[0]);
      if (isNaN(pid)) return { ...next, terminal: { ...next.terminal, output: addLine(output, "Usage: kill <pid>", "error") } };
      const result = kill(next, pid);
      output = addLine(output, result.message, result.message.includes("terminated") ? "success" : "error");
      return { ...result.state, terminal: { ...result.state.terminal, output } };
    }

    case "renice": {
      const pid = parseInt(args[0]), pri = parseInt(args[1]);
      if (isNaN(pid) || isNaN(pri)) return { ...next, terminal: { ...next.terminal, output: addLine(output, "Usage: renice <pid> <priority>", "error") } };
      const result = renice(next, pid, pri);
      output = addLine(output, result.message, result.message.includes("set to") ? "success" : "error");
      return { ...result.state, terminal: { ...result.state.terminal, output } };
    }

    case "ps": {
      if (next.processes.length === 0) {
        output = addLine(output, "No processes.", "info");
      } else {
        const rows = next.processes.map(p =>
          `PID ${String(p.pid).padEnd(4)} ${p.state.padEnd(10)} ${p.remainingTicks}/${p.totalTicks} ticks  pri ${p.priority}`
        );
        output = addLine(output, `PID   STATE      TICKS   PRI\n${rows.join("\n")}`, "info");
      }
      return { ...next, terminal: { ...next.terminal, output } };
    }

    case "alloc": {
      const pid = parseInt(args[0]), size = parseInt(args[1]);
      if (isNaN(pid) || isNaN(size)) return { ...next, terminal: { ...next.terminal, output: addLine(output, "Usage: alloc <pid> <size_kb>", "error") } };
      const result = allocateFrames(next.memory, pid, size);
      if (result.message) {
        output = addLine(output, `Error: ${result.message}`, "error");
      } else {
        // Build page table entries and attach to process
        const pageTable = buildPageTable(result.allocated);
        const newProcesses = next.processes.map(p =>
          p.pid === pid ? { ...p, pageTable: [...p.pageTable, ...pageTable], holds: [...p.holds, ...result.allocated] } : p
        );
        output = addLine(output, `Allocated ${size} KB to PID ${pid} (frames ${result.allocated[0]}–${result.allocated[result.allocated.length - 1]})`, "success");
        return { ...next, processes: newProcesses, memory: result.memory, terminal: { ...next.terminal, output } };
      }
      return { ...next, memory: result.memory, terminal: { ...next.terminal, output } };
    }

    case "free": {
      const fpid = parseInt(args[0]);
      if (isNaN(fpid)) return { ...next, terminal: { ...next.terminal, output: addLine(output, "Usage: free <pid>", "error") } };
      const newMem = freeProcessFrames(next.memory, fpid);
      // Clear page table and holds for the process
      const newProcesses = next.processes.map(p =>
        p.pid === fpid ? { ...p, pageTable: [], holds: [] } : p
      );
      const freed = state.memory.frames.filter(f => f.pid === fpid).length;
      output = addLine(output, `Freed ${freed} frames for PID ${fpid}`, "success");
      return { ...next, processes: newProcesses, memory: newMem, terminal: { ...next.terminal, output } };
    }

    case "pfault": {
      const pid = parseInt(args[0]), page = parseInt(args[1]);
      if (isNaN(pid) || isNaN(page)) return { ...next, terminal: { ...next.terminal, output: addLine(output, "Usage: pfault <pid> <page>", "error") } };
      const result = simulatePageFault(next, pid, page);
      output = addLine(output, result.message, "warning");
      return { ...result.state, terminal: { ...result.state.terminal, output } };
    }

    case "create": {
      if (args.length < 2) return { ...next, terminal: { ...next.terminal, output: addLine(output, "Usage: create <name> <blocks>", "error") } };
      const result = createFile(next.disk, args[0], parseInt(args[1]) || 1);
      output = addLine(output, result.message, result.message.startsWith("Created") ? "success" : "error");
      return { ...next, disk: result.disk, terminal: { ...next.terminal, output } };
    }

    case "rm": {
      if (args.length < 1) return { ...next, terminal: { ...next.terminal, output: addLine(output, "Usage: rm <name>", "error") } };
      const result = deleteFile(next.disk, args[0]);
      output = addLine(output, result.message, result.message.startsWith("Deleted") ? "success" : "error");
      return { ...next, disk: result.disk, terminal: { ...next.terminal, output } };
    }

    case "ls": {
      output = addLine(output, ls(next.disk), "info");
      return { ...next, terminal: { ...next.terminal, output } };
    }

    case "df": {
      output = addLine(output, df(next.disk), "info");
      return { ...next, terminal: { ...next.terminal, output } };
    }

    case "speed": {
      const ms = parseInt(args[0]);
      if (isNaN(ms) || ms < 50 || ms > 2000) return { ...next, terminal: { ...next.terminal, output: addLine(output, "Speed must be 50–2000ms", "error") } };
      output = addLine(output, `Speed set to ${ms}ms`, "success");
      return { ...next, speed: ms, terminal: { ...next.terminal, output } };
    }

    case "pause": {
      output = addLine(output, "⏸ Paused", "warning");
      return { ...next, running: false, terminal: { ...next.terminal, output } };
    }

    case "resume": {
      output = addLine(output, "▶ Resumed", "success");
      return { ...next, running: true, terminal: { ...next.terminal, output } };
    }

    case "clear": {
      return { ...next, terminal: { ...next.terminal, output: [] } };
    }

    default:
      output = addLine(output, `Unknown command: '${cmd}'. Type 'help'.`, "error");
      return { ...next, terminal: { ...next.terminal, output } };
  }
}
