"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3, CalendarDays, Coins, Loader2, Pencil, Plus, Receipt, Search,
  Settings2, Tag, Trash2, TrendingDown, TrendingUp, Wallet,
} from "lucide-react";
import { FinanceService } from "@/lib/services/finance.service";
import type {
  Budget, ExpenseCategory, ExpenseWithCategory,
} from "@/lib/types/finance";
import {
  categoryBreakdown, formatBDT, monthKey, monthlyTrend, summarize,
} from "@/lib/finance/analytics";
import { AdminModal, btnDanger, btnGhost, btnPrimary, input, label } from "./AdminUI";
import { BudgetProgress, CategoryBars, TrendArea } from "./FinanceCharts";

function Kpi({ icon: Icon, label: l, value, hint, trend }: {
  icon: typeof Wallet; label: string; value: string; hint?: string; trend?: number | null;
}) {
  const up = (trend ?? 0) >= 0;
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs text-slate-400">{l}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400"><Icon className="h-4 w-4" /></div>
      </div>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {typeof trend === "number" && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? "text-red-400" : "text-green-400"}`}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{Math.abs(trend).toFixed(0)}%
          </span>
        )}
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

interface ExpenseForm {
  id?: string; title: string; amount: string; category_id: string; spent_on: string;
  payment_method: string; reference_number: string; description: string;
}
const EMPTY_EXPENSE: ExpenseForm = {
  title: "", amount: "", category_id: "", spent_on: new Date().toISOString().slice(0, 10),
  payment_method: "", reference_number: "", description: "",
};

export function FinanceSection() {
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [thisMonthOnly, setThisMonthOnly] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE = 10;

  const [expForm, setExpForm] = useState<ExpenseForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ExpenseWithCategory | null>(null);
  const [budgetModal, setBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [catModal, setCatModal] = useState(false);
  const [newCat, setNewCat] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [e, c, b] = await Promise.all([
        FinanceService.expenses.list(), FinanceService.categories.list(), FinanceService.budgets.list(),
      ]);
      setExpenses(e); setCategories(c); setBudgets(b); setErr(null);
    } catch {
      setErr("Could not load finance data. Ensure migration 0005 has been applied.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const unsub = FinanceService.subscribe(fetchAll);
    return unsub;
  }, [fetchAll]);

  const mKey = monthKey(new Date());
  const monthlyBudget = useMemo(
    () => budgets.find((b) => b.period_type === "monthly" && b.period_key === mKey)?.amount ?? 0,
    [budgets, mKey],
  );

  const summary = useMemo(() => summarize(expenses, monthlyBudget), [expenses, monthlyBudget]);
  const trend = useMemo(() => monthlyTrend(expenses, 6), [expenses]);
  const breakdown = useMemo(() => categoryBreakdown(expenses), [expenses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter((e) => {
      if (catFilter !== "all" && e.category_id !== catFilter) return false;
      if (thisMonthOnly && e.spent_on.slice(0, 7) !== mKey) return false;
      if (!q) return true;
      return (e.title + " " + (e.category?.name ?? "") + " " + (e.payment_method ?? "")).toLowerCase().includes(q);
    });
  }, [expenses, query, catFilter, thisMonthOnly, mKey]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(safePage * PAGE, safePage * PAGE + PAGE);

  async function saveExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!expForm || !expForm.title.trim() || !expForm.amount) return;
    setSaving(true);
    try {
      const payload = {
        title: expForm.title.trim(),
        amount: parseFloat(expForm.amount),
        category_id: expForm.category_id || null,
        spent_on: expForm.spent_on,
        payment_method: expForm.payment_method.trim() || null,
        reference_number: expForm.reference_number.trim() || null,
        description: expForm.description.trim() || null,
      };
      if (expForm.id) await FinanceService.expenses.update(expForm.id, payload);
      else await FinanceService.expenses.create(payload);
      setExpForm(null);
      await fetchAll();
    } catch {
      setErr("Could not save the expense.");
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!confirmDelete) return;
    await FinanceService.expenses.remove(confirmDelete.id);
    setConfirmDelete(null);
    await fetchAll();
  }

  async function saveBudget() {
    const amt = parseFloat(budgetInput);
    if (isNaN(amt)) return;
    await FinanceService.budgets.upsert("monthly", mKey, amt);
    setBudgetModal(false);
    await fetchAll();
  }

  async function addCategory() {
    if (!newCat.trim()) return;
    await FinanceService.categories.create({ name: newCat.trim(), sort_order: categories.length + 1 });
    setNewCat("");
    await fetchAll();
  }
  async function removeCategory(id: string) {
    await FinanceService.categories.remove(id);
    await fetchAll();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Finance &amp; Budget</h2>
          <p className="text-sm text-slate-400">Executive overview of spending for {new Date().toLocaleDateString([], { month: "long", year: "numeric" })}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={btnGhost} onClick={() => setCatModal(true)}><Tag className="h-4 w-4" /> Categories</button>
          <button className={btnGhost} onClick={() => { setBudgetInput(String(monthlyBudget || "")); setBudgetModal(true); }}><Settings2 className="h-4 w-4" /> Set budget</button>
          <button className={btnPrimary} onClick={() => setExpForm({ ...EMPTY_EXPENSE })}><Plus className="h-4 w-4" /> Add expense</button>
        </div>
      </div>

      {err && <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{err}</div>}

      {/* KPI cards */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={Wallet} label="Monthly budget" value={formatBDT(summary.budget)} hint={summary.budget ? undefined : "Set a budget →"} />
        <Kpi icon={Coins} label="Spent this month" value={formatBDT(summary.spentThisMonth)} trend={summary.momChangePct} hint="vs last month" />
        <Kpi icon={Wallet} label="Remaining" value={formatBDT(summary.remaining)} hint={`${summary.progressPct.toFixed(0)}% used`} />
        <Kpi icon={CalendarDays} label="Daily average" value={formatBDT(summary.dailyAverage)} hint="this month" />
        <Kpi icon={Tag} label="Top category" value={summary.largestCategory?.name ?? "—"} hint={summary.largestCategory ? formatBDT(summary.largestCategory.total) : undefined} />
        <Kpi icon={Receipt} label="Records" value={String(summary.recordCount)} hint="this month" />
        <Kpi icon={Coins} label="Last expense" value={summary.lastExpense ? formatBDT(summary.lastExpense.amount) : "—"} hint={summary.lastExpense?.title} />
        <Kpi icon={BarChart3} label="Prev month" value={formatBDT(summary.prevMonthSpent)} hint="total spend" />
      </div>

      {/* Progress + breakdown */}
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <div className="glass-card rounded-2xl p-5 lg:col-span-1"><BudgetProgress spent={summary.spentThisMonth} budget={summary.budget} /></div>
        <div className="glass-card rounded-2xl p-5 lg:col-span-2">
          <p className="mb-3 text-sm font-semibold text-white">Category breakdown · this month</p>
          <CategoryBars data={breakdown} />
        </div>
      </div>

      {/* Trend */}
      <div className="mb-4 glass-card rounded-2xl p-5">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Monthly spending trend</p>
          <span className="text-xs text-slate-500">Last 6 months</span>
        </div>
        {loading ? <div className="h-[200px] animate-pulse rounded-lg bg-slate-800/40" /> : <TrendArea data={trend} />}
      </div>

      {/* Expense table */}
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className={`${input} pl-9`} placeholder="Search expenses…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} />
        </div>
        <div className="flex flex-wrap gap-2">
          <select className={`${input} w-auto`} value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(0); }}>
            <option value="all">All categories</option>
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <button onClick={() => { setThisMonthOnly((v) => !v); setPage(0); }}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${thisMonthOnly ? "bg-amber-500/20 text-amber-400" : "bg-slate-800/50 text-slate-400 hover:text-white"}`}>
            This month
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-800/50 text-left text-xs font-semibold text-slate-400">
              <tr>
                <th className="px-5 py-3">Title</th><th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Method</th><th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-700/40"><td colSpan={6} className="px-5 py-4"><div className="h-5 w-full animate-pulse rounded bg-slate-700/40" /></td></tr>
                ))
              ) : paged.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-14 text-center text-slate-500">No expenses match your filters.</td></tr>
              ) : (
                paged.map((e) => (
                  <tr key={e.id} className="border-t border-slate-700/40 hover:bg-slate-800/30">
                    <td className="px-5 py-3 font-medium text-white">{e.title}</td>
                    <td className="px-5 py-3">
                      {e.category ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-300">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: e.category.color }} />{e.category.name}
                        </span>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-white">{formatBDT(e.amount)}</td>
                    <td className="px-5 py-3 text-slate-400">{new Date(e.spent_on).toLocaleDateString([], { day: "numeric", month: "short" })}</td>
                    <td className="px-5 py-3 text-slate-400">{e.payment_method ?? "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button className="rounded-lg bg-slate-700/40 p-2 text-slate-300 hover:bg-slate-700/70 hover:text-white" title="Edit"
                          onClick={() => setExpForm({ id: e.id, title: e.title, amount: String(e.amount), category_id: e.category_id ?? "", spent_on: e.spent_on, payment_method: e.payment_method ?? "", reference_number: e.reference_number ?? "", description: e.description ?? "" })}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/25" title="Delete" onClick={() => setConfirmDelete(e)}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-700/40 px-5 py-3 text-xs text-slate-400">
            <span>{safePage * PAGE + 1}–{Math.min((safePage + 1) * PAGE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-2">
              <button className="rounded-lg bg-slate-700/40 px-3 py-1.5 disabled:opacity-40" disabled={safePage === 0} onClick={() => setPage((p) => p - 1)}>Prev</button>
              <span>{safePage + 1} / {pageCount}</span>
              <button className="rounded-lg bg-slate-700/40 px-3 py-1.5 disabled:opacity-40" disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit expense */}
      <AdminModal open={!!expForm} wide title={expForm?.id ? "Edit expense" : "Add expense"} onClose={() => setExpForm(null)}
        footer={<><button className={btnGhost} onClick={() => setExpForm(null)}>Cancel</button><button className={btnPrimary} onClick={saveExpense} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save</button></>}>
        {expForm && (
          <form onSubmit={saveExpense} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className={label}>Title</label><input className={input} value={expForm.title} onChange={(e) => setExpForm({ ...expForm, title: e.target.value })} autoFocus required /></div>
              <div><label className={label}>Amount (৳)</label><input className={input} type="number" min="0" step="0.01" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} required /></div>
              <div><label className={label}>Date</label><input className={input} type="date" value={expForm.spent_on} onChange={(e) => setExpForm({ ...expForm, spent_on: e.target.value })} /></div>
              <div><label className={label}>Category</label>
                <select className={input} value={expForm.category_id} onChange={(e) => setExpForm({ ...expForm, category_id: e.target.value })}>
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <div><label className={label}>Payment method</label><input className={input} value={expForm.payment_method} onChange={(e) => setExpForm({ ...expForm, payment_method: e.target.value })} placeholder="Card / bKash / Bank / Cash" /></div>
              <div className="sm:col-span-2"><label className={label}>Reference (optional)</label><input className={input} value={expForm.reference_number} onChange={(e) => setExpForm({ ...expForm, reference_number: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className={label}>Description</label><textarea className={input} rows={2} value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} /></div>
            </div>
          </form>
        )}
      </AdminModal>

      {/* Set budget */}
      <AdminModal open={budgetModal} title="Set monthly budget" subtitle={`For ${new Date().toLocaleDateString([], { month: "long", year: "numeric" })}`} onClose={() => setBudgetModal(false)}
        footer={<><button className={btnGhost} onClick={() => setBudgetModal(false)}>Cancel</button><button className={btnPrimary} onClick={saveBudget}>Save</button></>}>
        <label className={label}>Budget amount (৳)</label>
        <input className={input} type="number" min="0" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} autoFocus />
      </AdminModal>

      {/* Categories */}
      <AdminModal open={catModal} title="Expense categories" onClose={() => setCatModal(false)}>
        <div className="mb-4 flex gap-2">
          <input className={input} value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category name" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }} />
          <button className={btnPrimary} onClick={addCategory}><Plus className="h-4 w-4" /></button>
        </div>
        <div className="max-h-72 space-y-1.5 overflow-y-auto">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg bg-slate-800/40 px-3 py-2">
              <span className="flex items-center gap-2 text-sm text-slate-200"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} />{c.name}</span>
              <button className="rounded-md p-1.5 text-red-400 hover:bg-red-500/15" onClick={() => removeCategory(c.id)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      </AdminModal>

      {/* Delete confirm */}
      <AdminModal open={!!confirmDelete} title="Delete expense?" subtitle={confirmDelete?.title} onClose={() => setConfirmDelete(null)}
        footer={<><button className={btnGhost} onClick={() => setConfirmDelete(null)}>Cancel</button><button className={btnDanger} onClick={doDelete}><Trash2 className="h-4 w-4" /> Delete</button></>}>
        <p className="text-sm text-slate-300">This cannot be undone.</p>
      </AdminModal>
    </div>
  );
}
