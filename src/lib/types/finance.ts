// =============================================================================
// Finance domain types — mirror expense_categories / budgets / expenses
// (migration 0005). Currency is BDT. Amounts are coerced to number in services.
// =============================================================================

export type BudgetPeriod = "monthly" | "quarterly" | "yearly";

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  period_type: BudgetPeriod;
  period_key: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category_id: string | null;
  spent_on: string; // YYYY-MM-DD
  description: string | null;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseWithCategory extends Expense {
  category: { id: string; name: string; color: string } | null;
}

export type ExpenseInsert = {
  title: string;
  amount: number;
  category_id?: string | null;
  spent_on?: string;
  description?: string | null;
  payment_method?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  created_by?: string | null;
};
export type ExpenseUpdate = Partial<ExpenseInsert>;

export type CategoryInsert = { name: string; color?: string; is_active?: boolean; sort_order?: number };
export type CategoryUpdate = Partial<CategoryInsert>;
