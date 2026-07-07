import { useMemo } from "react";

interface Props {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  fill?: boolean;
}

export default function Sparkline({ data, color = "#00e5ff", width = 60, height = 20, fill = false }: Props) {
  const path = useMemo(() => {
    const points = data.slice(-100);
    if (points.length < 2) return "";
    const max = Math.max(...points, 1);
    const min = Math.min(...points, 0);
    const range = max - min || 1;
    const stepX = width / (points.length - 1);
    const d = points.map((v, i) =>
      `${i === 0 ? "M" : "L"} ${i * stepX}, ${height - ((v - min) / range) * (height - 2) - 1}`
    ).join(" ");
    if (fill) {
      const bottom = height - ((-min) / range) * (height - 2) - 1;
      return `${d} L ${width}, ${bottom} L 0, ${bottom} Z`;
    }
    return d;
  }, [data, width, height, fill]);

  if (!path) return <div style={{ width, height }} />;

  return (
    <svg width={width} height={height} className="shrink-0">
      <path d={path} fill={fill ? `${color}15` : "none"} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}
