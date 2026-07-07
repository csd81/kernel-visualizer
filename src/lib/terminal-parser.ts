import type { OutputLine } from "@/types/terminal";

let nextLineId = 100;

export function addLine(output: OutputLine[], text: string, type: OutputLine["type"] = "info"): OutputLine[] {
  return [...output, { id: nextLineId++, text, type }];
}

export function parseCommand(input: string): { cmd: string; args: string[] } {
  const trimmed = input.trim();
  if (!trimmed) return { cmd: "", args: [] };
  const parts = trimmed.split(/\s+/);
  return { cmd: parts[0].toLowerCase(), args: parts.slice(1) };
}
