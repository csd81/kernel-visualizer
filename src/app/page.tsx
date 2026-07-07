import DashboardGrid from "@/components/dashboard/DashboardGrid";
import SimulationProvider from "@/components/dashboard/SimulationProvider";

export default function Home() {
  return (
    <SimulationProvider>
      <DashboardGrid />
    </SimulationProvider>
  );
}
