"use client";

import Terminal from "../terminal/Terminal";
import { useSimulation } from "@/hooks/SimulationContext";

export default function TerminalPanel() {
  const { state, processCommand } = useSimulation();

  return (
    <section className="rounded-xl bg-white/3 backdrop-blur-xl border border-white/6 p-3 lg:p-5
      [border-color:var(--color-accent-terminal)]/30
      hover:[border-color:var(--color-accent-terminal)]/60 transition-colors row-span-1 lg:row-span-2 flex flex-col">
      <h2 className="text-[10px] lg:text-xs uppercase tracking-[0.12em] text-text-muted mb-2 lg:mb-3">
        ⌨ Terminal
      </h2>
      <div className="flex-1 min-h-[200px] lg:min-h-[300px]">
        <Terminal
          output={state.terminal.output}
          history={state.terminal.history}
          onCommand={processCommand}
        />
      </div>
    </section>
  );
}
