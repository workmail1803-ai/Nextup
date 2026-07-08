// =============================================================================
// FinanceService — categories, budgets, expenses. Reuses the shared client.
// Numeric columns arrive as strings from PostgREST → coerced to number here.
// =============================================================================

import { supabase } from "@/lib/supabase";
import type {
  Budget, BudgetPeriod, CategoryInsert, CategoryUpdate,
  ExpenseCategory, ExpenseInsert, ExpenseUpdate, ExpenseWithCategory,
} from "@/lib/types/finance";

function num(v: unknown): number {
  return typeof v === "number" ? v : parseFloat(String(v ?? 0)) || 0;
}

export const FinanceService = {
  // --- Categories ---
  categories: {
    async list(): Promise<ExpenseCategory[]> {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ExpenseCategory[];
    },
    async create(input: CategoryInsert): Promise<ExpenseCategory> {
      const { data, error } = await supabase.from("expense_categories").insert(input).select().single();
      if (error) throw error;
      return data as ExpenseCategory;
    },
    async update(id: string, patch: CategoryUpdate): Promise<ExpenseCategory> {
      const { data, error } = await supabase.from("expense_categories").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data as ExpenseCategory;
    },
    async remove(id: string): Promise<void> {
      const { error } = await supabase.from("expense_categories").delete().eq("id", id);
      if (error) throw error;
    },
  },

  // --- Budgets ---
  budgets: {
    async list(): Promise<Budget[]> {
      const { data, error } = await supabase.from("budgets").select("*");
      if (error) throw error;
      return (data ?? []).map((b) => ({ ...b, amount: num(b.amount) })) as Budget[];
    },
    async upsert(period_type: BudgetPeriod, period_key: string, amount: number): Promise<Budget> {
      const { data, error } = await supabase
        .from("budgets")
        .upsert({ period_type, period_key, amount }, { onConflict: "period_type,period_key" })
        .select()
        .single();
      if (error) throw error;
      return { ...(data as Budget), amount: num((data as Budget).amount) };
    },
  },

  // --- Expenses ---
  expenses: {
    async list(): Promise<ExpenseWithCategory[]> {
      const { data, error } = await supabase
        .from("expenses")
        .select("*, category:expense_categories(id,name,color)")
        .order("spent_on", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((e) => ({ ...e, amount: num(e.amount) })) as unknown as ExpenseWithCategory[];
    },
    async create(input: ExpenseInsert): Promise<void> {
      const { error } = await supabase.from("expenses").insert(input);
      if (error) throw error;
    },
    async update(id: string, patch: ExpenseUpdate): Promise<void> {
      const { error } = await supabase.from("expenses").update(patch).eq("id", id);
      if (error) throw error;
    },
    async remove(id: string): Promise<void> {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
  },

  /** Realtime — any expense/budget change. Returns unsubscribe. */
  subscribe(onChange: () => void): () => void {
    const channel = supabase
      .channel("finance-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => onChange())
      .on("postgres_changes", { event: "*", schema: "public", table: "budgets" }, () => onChange())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
