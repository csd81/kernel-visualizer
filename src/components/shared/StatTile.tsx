import Sparkline from "./Sparkline";

interface Props {
  icon: string;
  label: string;
  value: string | number;
  sparkline?: number[];
  sparkColor?: string;
  warn?: boolean;
  critical?: boolean;
}

export default function StatTile({ icon, label, value, sparkline, sparkColor, warn, critical }: Props) {
  return (
    <div className="flex items-center gap-1.5 lg:gap-2 bg-white/3 rounded-lg px-1.5 lg:px-2 py-1">
      <span className="text-[10px] lg:text-xs">{icon}</span>
      <div>
        <div className="text-[8px] lg:text-[9px] uppercase tracking-wider text-text-muted">{label}</div>
        <div className={`text-[10px] lg:text-xs font-mono font-semibold ${critical ? "text-red-400" : warn ? "text-yellow-400" : "text-text-primary"}`}>
          {value}
        </div>
      </div>
      {sparkline && <Sparkline data={sparkline} color={sparkColor} width={48} height={18} />}
    </div>
  );
}
