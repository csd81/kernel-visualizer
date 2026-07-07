export default function Header({ tick }: { tick: number }) {
  return (
    <header className="flex items-center justify-between px-1 lg:px-2">
      <h1 className="text-lg lg:text-xl font-semibold tracking-tight">
        <span className="text-text-muted">Kernel</span> Visualizer
      </h1>
      <span className="font-mono text-xs text-text-secondary">
        tick: <span className="text-text-primary font-semibold">{tick}</span>
      </span>
    </header>
  );
}
