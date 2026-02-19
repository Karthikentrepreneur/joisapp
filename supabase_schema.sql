
-- ==========================================
-- SCHEMA REPAIR & INITIALIZATION
-- ==========================================

-- Repair existing invoices table if it exists
ALTER TABLE IF EXISTS invoices ADD COLUMN IF NOT EXISTS breakdown JSONB;
ALTER TABLE IF EXISTS invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE IF EXISTS invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Ensure Students table has offer column
ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS offer TEXT DEFAULT 'Regular';

-- ==========================================
-- TABLE DEFINITIONS
-- ==========================================

-- Students Table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  name TEXT NOT NULL,
  dob DATE,
  blood_group TEXT,
  mother_name TEXT,
  mother_email TEXT,
  father_name TEXT,
  father_email TEXT,
  program TEXT,
  date_of_joining DATE NOT NULL,
  offer TEXT DEFAULT 'Regular',
  emergency_contact JSONB,
  attendance NUMERIC DEFAULT 100,
  fees_status TEXT DEFAULT 'Pending',
  bus_route TEXT DEFAULT 'Self Pickup',
  image TEXT,
  parent_id TEXT,
  parent_phone TEXT NOT NULL,
  parent_email TEXT,
  address TEXT,
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  breakdown JSONB, -- Stores {application, registration, material, term1, term2, term3}
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'Pending',
  type TEXT NOT NULL,
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security & Realtime
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
DECLARE
    row record;
BEGIN
    FOR row IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    LOOP
        BEGIN
            EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE ' || quote_ident(row.tablename);
        EXCEPTION WHEN others THEN NULL;
        END;
    END LOOP;
END $$;

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(t) || ' ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Allow All Access" ON ' || quote_ident(t);
        EXECUTE 'CREATE POLICY "Allow All Access" ON ' || quote_ident(t) || ' FOR ALL USING (true) WITH CHECK (true)';
    END LOOP;
END $$;
