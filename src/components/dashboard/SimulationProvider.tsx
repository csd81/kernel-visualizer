"use client";

import { useSimulation as useSimulationHook } from "@/hooks/useSimulation";
import { SimulationContext } from "@/hooks/SimulationContext";

export default function SimulationProvider({ children }: { children: React.ReactNode }) {
  const sim = useSimulationHook();
  return (
    <SimulationContext.Provider value={sim}>
      {children}
    </SimulationContext.Provider>
  );
}
