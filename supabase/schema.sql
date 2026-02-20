-- =====================================================
-- NextUp Mentor - Supabase Database Schema
-- DEVELOPMENT VERSION - More permissive RLS policies
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PACKAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(500),
    icon VARCHAR(10) DEFAULT '📚',
    price INTEGER NOT NULL CHECK (price >= 0),
    features TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order SMALLINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_packages_order ON packages(display_order);

-- =====================================================
-- 2. ENROLLMENTS TABLE
-- =====================================================
DO $$ BEGIN
    CREATE TYPE enrollment_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_name VARCHAR(200) NOT NULL,
    student_email VARCHAR(255),
    student_phone VARCHAR(20),
    package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
    package_title VARCHAR(200) NOT NULL,
    amount INTEGER NOT NULL,
    transaction_id VARCHAR(100) NOT NULL,
    status enrollment_status DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_created ON enrollments(created_at DESC);

-- =====================================================
-- 3. MESSAGES TABLE
-- =====================================================
DO $$ BEGIN
    CREATE TYPE message_status AS ENUM ('unread', 'read', 'replied');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    destination VARCHAR(100),
    message TEXT NOT NULL,
    status message_status DEFAULT 'unread',
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- =====================================================
-- 4. AUTO-UPDATE TIMESTAMPS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS packages_updated_at ON packages;
CREATE TRIGGER packages_updated_at
    BEFORE UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS enrollments_updated_at ON enrollments;
CREATE TRIGGER enrollments_updated_at
    BEFORE UPDATE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 5. ROW LEVEL SECURITY - DEVELOPMENT (PERMISSIVE)
-- =====================================================

-- Enable RLS
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all for packages" ON packages;
DROP POLICY IF EXISTS "Allow all for enrollments" ON enrollments;
DROP POLICY IF EXISTS "Allow all for messages" ON messages;

-- PACKAGES: Allow public read and authenticated write
-- For development, we allow all operations
CREATE POLICY "Allow all for packages" ON packages
    FOR ALL USING (true) WITH CHECK (true);

-- ENROLLMENTS: Allow all operations  
CREATE POLICY "Allow all for enrollments" ON enrollments
    FOR ALL USING (true) WITH CHECK (true);

-- MESSAGES: Allow all operations
CREATE POLICY "Allow all for messages" ON messages
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 6. SEED DATA
-- =====================================================
INSERT INTO packages (title, subtitle, icon, price, features, images, is_popular, display_order)
SELECT 
    'University Application Support',
    'Complete admission guidance for your dream university',
    '📚',
    25000,
    ARRAY['Profile evaluation & university matching', 'SOP & motivation letter assistance', 'Document preparation & review', 'Application submission support', 'University communication handling'],
    ARRAY['https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80'],
    FALSE,
    1
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE title = 'University Application Support');

INSERT INTO packages (title, subtitle, icon, price, features, images, is_popular, display_order)
SELECT 
    'Complete Visa Guidance',
    'Expert assistance for successful visa approval',
    '🛂',
    35000,
    ARRAY['Visa file preparation', 'Financial documentation guidance', 'Embassy interview preparation', 'Mock interview sessions', 'Appointment booking assistance'],
    ARRAY['https://images.unsplash.com/photo-1569420822601-344403378b27?w=800&q=80'],
    FALSE,
    2
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE title = 'Complete Visa Guidance');

INSERT INTO packages (title, subtitle, icon, price, features, images, is_popular, display_order)
SELECT 
    'End-to-End Mentorship',
    'Complete journey from IELTS to landing in Europe',
    '🌟',
    75000,
    ARRAY['IELTS/English proficiency prep', 'University admission support', 'Complete visa processing', 'Pre-departure orientation', 'Airport pickup & accommodation help', 'Post-arrival support for 3 months'],
    ARRAY['https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80'],
    TRUE,
    3
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE title = 'End-to-End Mentorship');

-- =====================================================
-- DONE! Your database is ready.
-- =====================================================
