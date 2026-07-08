// =============================================================================
// Finance — pure analytics layer (no I/O). All KPI math + chart series derive
// here so the dashboard and future reports share one source of truth.
// =============================================================================

import type { ExpenseWithCategory } from "@/lib/types/finance";

export function formatBDT(n: number, compact = false): string {
  if (compact && Math.abs(n) >= 1000) {
    if (Math.abs(n) >= 10000000) return `৳${(n / 10000000).toFixed(2)}Cr`;
    if (Math.abs(n) >= 100000) return `৳${(n / 100000).toFixed(2)}L`;
    if (Math.abs(n) >= 1000) return `৳${(n / 1000).toFixed(1)}k`;
  }
  return "৳" + Math.round(n).toLocaleString("en-IN");
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function inMonth(dateStr: string, d: Date): boolean {
  return dateStr.slice(0, 7) === monthKey(d);
}

export interface FinanceSummary {
  budget: number;
  spentThisMonth: number;
  remaining: number;
  progressPct: number;
  dailyAverage: number;
  largestCategory: { name: string; color: string; total: number } | null;
  recordCount: number;
  lastExpense: ExpenseWithCategory | null;
  prevMonthSpent: number;
  momChangePct: number | null;
}

export function summarize(
  expenses: ExpenseWithCategory[],
  monthlyBudget: number,
  now: Date = new Date(),
): FinanceSummary {
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  let spentThisMonth = 0;
  let prevMonthSpent = 0;
  const catTotals = new Map<string, { name: string; color: string; total: number }>();

  for (const e of expenses) {
    if (inMonth(e.spent_on, now)) {
      spentThisMonth += e.amount;
      if (e.category) {
        const cur = catTotals.get(e.category.id) ?? { name: e.category.name, color: e.category.color, total: 0 };
        cur.total += e.amount;
        catTotals.set(e.category.id, cur);
      }
    }
    if (inMonth(e.spent_on, prev)) prevMonthSpent += e.amount;
  }

  const largest = [...catTotals.values()].sort((a, b) => b.total - a.total)[0] ?? null;
  const daysElapsed = now.getDate();
  const monthExpenses = expenses.filter((e) => inMonth(e.spent_on, now));
  const lastExpense =
    [...monthExpenses].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ??
    [...expenses].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ??
    null;

  const remaining = monthlyBudget - spentThisMonth;
  const momChangePct =
    prevMonthSpent > 0 ? ((spentThisMonth - prevMonthSpent) / prevMonthSpent) * 100 : null;

  return {
    budget: monthlyBudget,
    spentThisMonth,
    remaining,
    progressPct: monthlyBudget > 0 ? (spentThisMonth / monthlyBudget) * 100 : 0,
    dailyAverage: daysElapsed > 0 ? spentThisMonth / daysElapsed : 0,
    largestCategory: largest,
    recordCount: monthExpenses.length,
    lastExpense,
    prevMonthSpent,
    momChangePct,
  };
}

/** Total spend per month for the last `months` months (oldest→newest). */
export function monthlyTrend(
  expenses: ExpenseWithCategory[],
  months = 6,
  now: Date = new Date(),
): { label: string; value: number; key: string }[] {
  const byMonth = new Map<string, number>();
  for (const e of expenses) {
    const k = e.spent_on.slice(0, 7);
    byMonth.set(k, (byMonth.get(k) ?? 0) + e.amount);
  }
  const out: { label: string; value: number; key: string }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = monthKey(d);
    out.push({ key: k, label: d.toLocaleDateString([], { month: "short" }), value: byMonth.get(k) ?? 0 });
  }
  return out;
}

/** Category totals for the current month, largest first. */
export function categoryBreakdown(
  expenses: ExpenseWithCategory[],
  now: Date = new Date(),
): { name: string; color: string; total: number; pct: number }[] {
  const map = new Map<string, { name: string; color: string; total: number }>();
  let grand = 0;
  for (const e of expenses) {
    if (!inMonth(e.spent_on, now) || !e.category) continue;
    grand += e.amount;
    const cur = map.get(e.category.id) ?? { name: e.category.name, color: e.category.color, total: 0 };
    cur.total += e.amount;
    map.set(e.category.id, cur);
  }
  return [...map.values()]
    .map((c) => ({ ...c, pct: grand > 0 ? (c.total / grand) * 100 : 0 }))
    .sort((a, b) => b.total - a.total);
}

/** Cumulative daily spend for the current month (area chart series). */
export function dailyCumulative(
  expenses: ExpenseWithCategory[],
  now: Date = new Date(),
): { label: string; value: number }[] {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const perDay = new Array(daysInMonth + 1).fill(0);
  for (const e of expenses) {
    if (!inMonth(e.spent_on, now)) continue;
    const day = Number(e.spent_on.slice(8, 10));
    if (day >= 1 && day <= daysInMonth) perDay[day] += e.amount;
  }
  const out: { label: string; value: number }[] = [];
  let cum = 0;
  const upto = now.getDate();
  for (let d = 1; d <= upto; d++) {
    cum += perDay[d];
    out.push({ label: String(d), value: cum });
  }
  return out;
}
