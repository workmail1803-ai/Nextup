"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Receipt } from "lucide-react";
import { AreaChart, useToast } from "@/components/internal";
import { Sheet } from "@/components/crm/Sheet";
import { FinanceService } from "@/lib/services/finance.service";
import {
  categoryBreakdown, dailyCumulative, formatBDT, monthKey, summarize,
} from "@/lib/finance/analytics";
import { localDateKey } from "@/lib/attendance/compute";
import type { Budget, ExpenseCategory, ExpenseInsert, ExpenseWithCategory } from "@/lib/types/finance";

export default function FinancePage() {
  const toast = useToast();
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [logOpen, setLogOpen] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      FinanceService.expenses.list(),
      FinanceService.categories.list(),
      FinanceService.budgets.list(),
    ])
      .then(([e, c, b]) => {
        setExpenses(e);
        setCategories(c);
        setBudgets(b);
      })
      .catch((err) =>
        toast({ title: "Couldn't load finance", description: err instanceof Error ? err.message : String(err), tone: "error" }),
      )
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const budget = budgets.find((b) => b.period_type === "monthly" && b.period_key === monthKey(new Date()))?.amount ?? 0;
  const fin = useMemo(() => summarize(expenses, budget), [expenses, budget]);
  const cumulative = useMemo(() => dailyCumulative(expenses), [expenses]);
  const breakdown = useMemo(() => categoryBreakdown(expenses), [expenses]);
  const recent = useMemo(
    () => [...expenses].sort((a, b) => b.spent_on.localeCompare(a.spent_on)).slice(0, 15),
    [expenses],
  );

  const kpis = [
    { label: "Spent this month", value: formatBDT(fin.spentThisMonth, true), hint: monthKey(new Date()) },
    { label: "Budget used", value: budget > 0 ? `${Math.round(fin.progressPct)}%` : "—", hint: budget > 0 ? `of ${formatBDT(budget, true)}` : "no budget set" },
    { label: "Left to spend", value: budget > 0 ? formatBDT(fin.remaining, true) : "—", hint: "this month" },
    { label: "Daily average", value: formatBDT(fin.dailyAverage, true), hint: "so far" },
  ];

  return (
    <div className="space-y-6 py-5">
      <div className="flex items-center justify-between px-4 sm:px-6">
        <p className="text-sm" style={{ color: "var(--nx-muted)" }}>
          Where the money went — and how fast it&apos;s going.
        </p>
        <button className="nx-btn nx-btn-primary px-3.5 py-2 text-[0.82rem]" onClick={() => setLogOpen(true)}>
          <Plus className="h-4 w-4" /> Log expense
        </button>
      </div>

      {/* KPI rail */}
      <div className="crm-snap">
        {kpis.map((k) => (
          <div key={k.label} className="crm-card w-[9.5rem] p-4">
            <p className="text-[0.7rem] font-medium" style={{ color: "var(--nx-faint)" }}>{k.label}</p>
            <p className="crm-num nx-display mt-1.5 text-[1.45rem] font-semibold leading-none" style={{ color: "var(--nx-text)" }}>
              {loading ? "–" : k.value}
            </p>
            <p className="mt-1.5 text-[0.68rem]" style={{ color: "var(--nx-faint)" }}>{k.hint}</p>
          </div>
        ))}
      </div>

      {/* Cumulative spend */}
      <section className="px-4 sm:px-6">
        <h3 className="crm-section-title mb-2.5">Spend curve · this month</h3>
        <div className="crm-card p-4">
          {loading && <div className="nx-skeleton h-32 rounded-xl" />}
          {!loading && cumulative.length > 0 ? (
            <AreaChart
              data={cumulative}
              height={160}
              labelEvery={Math.max(1, Math.floor(cumulative.length / 7))}
              valueFormat={(n) => formatBDT(n, true)}
            />
          ) : (
            !loading && (
              <p className="py-8 text-center text-sm" style={{ color: "var(--nx-faint)" }}>
                Nothing spent yet this month.
              </p>
            )
          )}
        </div>
      </section>

      {/* Category breakdown */}
      <section className="px-4 sm:px-6">
        <h3 className="crm-section-title mb-2.5">By category</h3>
        <div className="crm-card space-y-3 p-4">
          {loading && <div className="nx-skeleton h-20 rounded-xl" />}
          {!loading && breakdown.length === 0 && (
            <p className="py-4 text-center text-sm" style={{ color: "var(--nx-faint)" }}>
              Categorised spend will chart here.
            </p>
          )}
          {!loading &&
            breakdown.slice(0, 6).map((c) => (
              <div key={c.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5" style={{ color: "var(--nx-muted)" }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                    {c.name}
                  </span>
                  <span className="crm-num font-medium" style={{ color: "var(--nx-text)" }}>
                    {formatBDT(c.total, true)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--nx-panel-2)" }}>
                  <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Recent expenses */}
      <section className="px-4 sm:px-6">
        <h3 className="crm-section-title mb-2.5">Recent expenses</h3>
        <div className="crm-card overflow-hidden">
          {loading && <div className="nx-skeleton m-3 h-24 rounded-xl" />}
          {!loading && recent.length === 0 && (
            <div className="flex items-center gap-3 px-4 py-6">
              <Receipt className="h-5 w-5 shrink-0" style={{ color: "var(--nx-faint)" }} />
              <p className="text-sm" style={{ color: "var(--nx-muted)" }}>
                Log the first expense to start the ledger.
              </p>
            </div>
          )}
          {!loading &&
            recent.map((e, i) => (
              <div
                key={e.id}
                className="crm-row"
                style={i > 0 ? { borderTop: "1px solid var(--nx-edge)", borderRadius: 0 } : { borderRadius: 0 }}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: e.category?.color ?? "var(--nx-edge-2)" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: "var(--nx-text)" }}>{e.title}</p>
                  <p className="crm-num truncate text-xs" style={{ color: "var(--nx-faint)" }}>
                    {e.spent_on}
                    {e.category ? ` · ${e.category.name}` : ""}
                  </p>
                </div>
                <span className="crm-num shrink-0 text-sm font-semibold" style={{ color: "var(--nx-text)" }}>
                  {formatBDT(e.amount)}
                </span>
              </div>
            ))}
        </div>
      </section>

      <LogExpenseSheet
        open={logOpen}
        categories={categories}
        onClose={() => setLogOpen(false)}
        onLogged={() => {
          setLogOpen(false);
          load();
        }}
      />
    </div>
  );
}

// --- Log expense -------------------------------------------------------------

function LogExpenseSheet({
  open, categories, onClose, onLogged,
}: {
  open: boolean;
  categories: ExpenseCategory[];
  onClose: () => void;
  onLogged: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({ title: "", amount: "", spent_on: localDateKey(), category: "", method: "" });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Math.round(Number(form.amount));
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Add a title and a positive amount", tone: "error" });
      return;
    }
    setSaving(true);
    try {
      const payload: ExpenseInsert = {
        title: form.title.trim(),
        amount,
        spent_on: form.spent_on,
        category_id: form.category || null,
        payment_method: form.method.trim() || null,
      };
      await FinanceService.expenses.create(payload);
      toast({ title: "Expense logged", description: formatBDT(amount), tone: "success" });
      setForm({ title: "", amount: "", spent_on: localDateKey(), category: "", method: "" });
      onLogged();
    } catch (err) {
      toast({ title: "Couldn't log the expense", description: err instanceof Error ? err.message : String(err), tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} label="Log an expense">
      <form onSubmit={submit} className="space-y-4 pt-1">
        <h3 className="nx-display text-lg font-semibold" style={{ color: "var(--nx-text)" }}>
          Log an expense
        </h3>
        <div>
          <label className="nx-label">What was it for?</label>
          <input className="nx-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="nx-label">Amount (BDT)</label>
            <input className="nx-input crm-num" type="number" inputMode="numeric" min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div>
            <label className="nx-label">Date</label>
            <input className="nx-input crm-num" type="date" value={form.spent_on} onChange={(e) => setForm({ ...form, spent_on: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="nx-label">Category</label>
            <select className="nx-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="nx-label">Paid via</label>
            <input className="nx-input" placeholder="bKash, cash…" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} />
          </div>
        </div>
        <button className="nx-btn nx-btn-primary w-full py-3" disabled={saving}>
          {saving ? "Logging…" : "Log expense"}
        </button>
      </form>
    </Sheet>
  );
}
