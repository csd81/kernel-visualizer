export interface OutputLine {
  id: number;
  text: string;
  type: "input" | "output" | "info" | "success" | "error" | "warning";
}

export interface TerminalState {
  output: OutputLine[];
  history: string[];
  historyIndex: number;
}
