-- =====================================================
-- NextUp Mentor — Finance & Budget module (admin-only)
-- Migration 0005 (ADDITIVE). Idempotent. Currency: BDT (৳).
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN CREATE TYPE budget_period AS ENUM ('monthly','quarterly','yearly'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================
-- 1. EXPENSE CATEGORIES
-- =====================================================
CREATE TABLE IF NOT EXISTS expense_categories (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(80) NOT NULL,
    color      VARCHAR(9) NOT NULL DEFAULT '#a85a1a',
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_expense_categories_name ON expense_categories (lower(name));
CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON expense_categories (is_active) WHERE is_active = TRUE;

-- =====================================================
-- 2. BUDGETS  (one row per period)
-- =====================================================
CREATE TABLE IF NOT EXISTS budgets (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_type budget_period NOT NULL,
    period_key  VARCHAR(12) NOT NULL,     -- '2026-07' | '2026-Q3' | '2026'
    amount      NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_period ON budgets (period_type, period_key);

-- =====================================================
-- 3. EXPENSES
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title            VARCHAR(200) NOT NULL,
    amount           NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    category_id      UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    spent_on         DATE NOT NULL DEFAULT ((NOW() AT TIME ZONE 'utc')::date),
    description      TEXT,
    payment_method   VARCHAR(60),
    reference_number VARCHAR(120),
    notes            TEXT,
    created_by       VARCHAR(120) DEFAULT 'Admin',
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date     ON expenses (spent_on DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_created  ON expenses (created_at DESC);
-- Hot path: category totals within a date range.
CREATE INDEX IF NOT EXISTS idx_expenses_cat_date ON expenses (category_id, spent_on DESC);

-- =====================================================
-- 4. EXPENSE LOGS  (audit trail — future ready)
-- =====================================================
CREATE TABLE IF NOT EXISTS expense_logs (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    action     VARCHAR(40) NOT NULL,
    detail     JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expense_logs_expense ON expense_logs (expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_logs_created ON expense_logs (created_at DESC);

-- =====================================================
-- 5. updated_at triggers
-- =====================================================
DROP TRIGGER IF EXISTS expense_categories_updated_at ON expense_categories;
CREATE TRIGGER expense_categories_updated_at BEFORE UPDATE ON expense_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS budgets_updated_at ON budgets;
CREATE TRIGGER budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS expenses_updated_at ON expenses;
CREATE TRIGGER expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 6. RLS (permissive dev; UI gates to admin)
-- =====================================================
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_logs       ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for expense_categories" ON expense_categories;
CREATE POLICY "Allow all for expense_categories" ON expense_categories FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for budgets" ON budgets;
CREATE POLICY "Allow all for budgets" ON budgets FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for expenses" ON expenses;
CREATE POLICY "Allow all for expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all for expense_logs" ON expense_logs;
CREATE POLICY "Allow all for expense_logs" ON expense_logs FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 7. Realtime
-- =====================================================
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE expenses; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE budgets; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE expense_categories; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================
-- 8. SEED — categories, budgets, demo expenses (BDT)
-- =====================================================
INSERT INTO expense_categories (name, color, sort_order)
SELECT * FROM (VALUES
    ('Marketing',      '#a85a1a', 1),
    ('Advertising',    '#c2701f', 2),
    ('Salary',         '#2f7d52', 3),
    ('Freelancers',    '#3b7dd8', 4),
    ('Software',       '#7c5cff', 5),
    ('Subscriptions',  '#b6791b', 6),
    ('Office',         '#8a6d3b', 7),
    ('Office Supplies', '#9a7b4f', 8),
    ('Utilities',      '#0e9aa7', 9),
    ('Internet',       '#2b8a9e', 10),
    ('Hosting',        '#5b6b8c', 11),
    ('Visa Processing', '#b3392f', 12),
    ('University Fees', '#7a4fb3', 13),
    ('Travel',         '#d08b1f', 14),
    ('Food',           '#c25b4f', 15),
    ('Equipment',      '#556b7d', 16),
    ('Miscellaneous',  '#6b6357', 17)
) AS v(name, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM expense_categories);

INSERT INTO budgets (period_type, period_key, amount)
SELECT 'monthly', '2026-07', 500000 WHERE NOT EXISTS (SELECT 1 FROM budgets WHERE period_type='monthly' AND period_key='2026-07');
INSERT INTO budgets (period_type, period_key, amount)
SELECT 'quarterly', '2026-Q3', 1500000 WHERE NOT EXISTS (SELECT 1 FROM budgets WHERE period_type='quarterly' AND period_key='2026-Q3');
INSERT INTO budgets (period_type, period_key, amount)
SELECT 'yearly', '2026', 6000000 WHERE NOT EXISTS (SELECT 1 FROM budgets WHERE period_type='yearly' AND period_key='2026');

-- Demo expenses (only when the table is empty)
INSERT INTO expenses (title, amount, category_id, spent_on, payment_method, created_by)
SELECT e.title, e.amount, c.id, e.spent_on, e.method, 'Admin'
FROM (VALUES
    ('Facebook Ads — July campaign', 45000, 'Advertising',    DATE '2026-07-02', 'Card'),
    ('Office rent — July',           60000, 'Office',         DATE '2026-07-01', 'Bank'),
    ('Team salaries (partial)',     180000, 'Salary',         DATE '2026-07-01', 'Bank'),
    ('Canva Pro',                     1500, 'Software',       DATE '2026-07-03', 'Card'),
    ('Zoom subscription',             1800, 'Subscriptions',  DATE '2026-07-01', 'Card'),
    ('Internet bill',                 3500, 'Internet',       DATE '2026-07-02', 'bKash'),
    ('Supabase hosting',              2500, 'Hosting',        DATE '2026-07-01', 'Card'),
    ('Electricity bill',              4800, 'Utilities',      DATE '2026-07-01', 'bKash'),
    ('Misc supplies',                 2000, 'Miscellaneous',  DATE '2026-07-03', 'Cash'),
    ('VFS processing fees',          12000, 'Visa Processing', DATE '2026-06-28', 'Cash'),
    ('University application fees',   25000, 'University Fees', DATE '2026-06-25', 'Bank'),
    ('Freelance designer',           15000, 'Freelancers',    DATE '2026-06-20', 'bKash'),
    ('Google Ads',                   22000, 'Advertising',    DATE '2026-06-22', 'Card'),
    ('Client meeting lunch',          3200, 'Food',           DATE '2026-06-18', 'Cash'),
    ('Office supplies restock',       5500, 'Office Supplies', DATE '2026-06-15', 'Cash'),
    ('New laptop',                   85000, 'Equipment',      DATE '2026-06-10', 'Card'),
    ('Domain renewal',                1200, 'Hosting',        DATE '2026-06-12', 'Card'),
    ('Travel — client visit',         6500, 'Travel',         DATE '2026-06-19', 'Cash')
) AS e(title, amount, cat, spent_on, method)
JOIN expense_categories c ON lower(c.name) = lower(e.cat)
WHERE NOT EXISTS (SELECT 1 FROM expenses);
