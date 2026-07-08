"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface ChartPoint {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: ChartPoint[];
  height?: number;
  /** Show every Nth x label (avoids crowding). */
  labelEvery?: number;
  valueFormat?: (n: number) => string;
  className?: string;
}

const W = 640; // viewBox width; scales to container via width:100%

/** Build a smooth cardinal-spline path through the points. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  const t = 0.18; // tension
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = p2.y - (p3.y - p1.y) * t;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/**
 * Bespoke SVG area+line chart — themeable, dependency-free. Baseline grid,
 * bronze gradient fill, hover dots with native tooltips. Reused by Finance.
 */
export function AreaChart({
  data,
  height = 200,
  labelEvery = 1,
  valueFormat = (n) => String(n),
  className,
}: AreaChartProps) {
  const gid = useId().replace(/:/g, "");
  const padX = 12;
  const padTop = 16;
  const padBottom = 26;
  const innerW = W - padX * 2;
  const innerH = height - padTop - padBottom;

  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const pts = data.map((d, i) => ({
    x: padX + i * stepX,
    y: padTop + innerH - (d.value / max) * innerH,
  }));

  const line = smoothPath(pts);
  const area =
    pts.length > 0
      ? `${line} L ${pts[pts.length - 1].x} ${padTop + innerH} L ${pts[0].x} ${padTop + innerH} Z`
      : "";

  const gridLines = [0, 0.5, 1];

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        role="img"
        aria-label="Area chart"
      >
        <defs>
          <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--nx-accent)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--nx-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* horizontal grid */}
        {gridLines.map((g) => {
          const y = padTop + innerH * g;
          return (
            <line
              key={g}
              x1={padX}
              x2={W - padX}
              y1={y}
              y2={y}
              stroke="var(--nx-edge)"
              strokeWidth={1}
              strokeDasharray={g === 1 ? "0" : "3 4"}
            />
          );
        })}

        {area && <path d={area} fill={`url(#fill-${gid})`} />}
        {line && (
          <path
            d={line}
            fill="none"
            stroke="var(--nx-accent-2)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* points */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill="var(--nx-accent-2)" />
            <circle cx={p.x} cy={p.y} r={9} fill="transparent">
              <title>{`${data[i].label}: ${valueFormat(data[i].value)}`}</title>
            </circle>
          </g>
        ))}

        {/* x labels */}
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text
              key={i}
              x={padX + i * stepX}
              y={height - 8}
              textAnchor="middle"
              fontSize={11}
              fill="var(--nx-faint)"
            >
              {d.label}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}
