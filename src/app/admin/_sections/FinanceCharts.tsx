"use client";

import { useId } from "react";
import { formatBDT } from "@/lib/finance/analytics";

// --- Smooth area chart (monthly trend / daily cumulative) --------------------
function smooth(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return pts.length ? `M ${pts[0].x} ${pts[0].y}` : "";
  const t = 0.18;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? pts[i + 1];
    d += ` C ${p1.x + (p2.x - p0.x) * t} ${p1.y + (p2.y - p0.y) * t}, ${p2.x - (p3.x - p1.x) * t} ${p2.y - (p3.y - p1.y) * t}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function TrendArea({ data, height = 200 }: { data: { label: string; value: number }[]; height?: number }) {
  const gid = useId().replace(/:/g, "");
  const W = 640, padX = 14, padTop = 16, padBottom = 26;
  const innerW = W - padX * 2, innerH = height - padTop - padBottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;
  const pts = data.map((d, i) => ({ x: padX + i * step, y: padTop + innerH - (d.value / max) * innerH }));
  const line = smooth(pts);
  const area = pts.length ? `${line} L ${pts[pts.length - 1].x} ${padTop + innerH} L ${pts[0].x} ${padTop + innerH} Z` : "";
  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label="Spending trend">
      <defs>
        <linearGradient id={`fa-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((g) => (
        <line key={g} x1={padX} x2={W - padX} y1={padTop + innerH * g} y2={padTop + innerH * g} stroke="rgba(148,163,184,0.12)" strokeDasharray={g === 1 ? "0" : "3 4"} />
      ))}
      {area && <path d={area} fill={`url(#fa-${gid})`} />}
      {line && <path d={line} fill="none" stroke="#f59e0b" strokeWidth={2.5} strokeLinecap="round" />}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="#f59e0b" />
          <circle cx={p.x} cy={p.y} r={9} fill="transparent"><title>{`${data[i].label}: ${formatBDT(data[i].value)}`}</title></circle>
        </g>
      ))}
      {data.map((d, i) => (
        <text key={i} x={padX + i * step} y={height - 8} textAnchor="middle" fontSize={11} fill="rgba(148,163,184,0.7)">{d.label}</text>
      ))}
    </svg>
  );
}

// --- Category horizontal bars ------------------------------------------------
export function CategoryBars({ data }: { data: { name: string; color: string; total: number; pct: number }[] }) {
  if (data.length === 0) return <p className="py-8 text-center text-sm text-slate-500">No spending this month yet.</p>;
  const max = Math.max(...data.map((d) => d.total));
  return (
    <div className="space-y-3">
      {data.slice(0, 8).map((d) => (
        <div key={d.name}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} /> {d.name}
            </span>
            <span className="font-medium text-white">{formatBDT(d.total)} <span className="text-slate-500">· {d.pct.toFixed(0)}%</span></span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800/70">
            <div className="h-full rounded-full" style={{ width: `${(d.total / max) * 100}%`, background: d.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Budget progress ---------------------------------------------------------
export function BudgetProgress({ spent, budget }: { spent: number; budget: number }) {
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const over = spent > budget;
  const color = over ? "#ef4444" : pct >= 90 ? "#f97316" : pct >= 75 ? "#f59e0b" : pct >= 50 ? "#eab308" : "#22c55e";
  const remaining = budget - spent;
  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-400">Spent this month</p>
          <p className="text-2xl font-bold text-white">{formatBDT(spent)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">{over ? "Over budget" : "Remaining"}</p>
          <p className="text-lg font-semibold" style={{ color }}>{formatBDT(Math.abs(remaining))}</p>
        </div>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-800/70">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-slate-500">
        <span>{pct.toFixed(0)}% of {formatBDT(budget)}</span>
        {over && <span className="font-semibold text-red-400">⚠ exceeded</span>}
        {!over && pct >= 90 && <span className="font-semibold text-orange-400">Approaching limit</span>}
      </div>
    </div>
  );
}
