
-- ==========================================
-- SCHEMA INITIALIZATION: CORE TABLES
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
  offer TEXT,
  emergency_contact JSONB,
  attendance NUMERIC DEFAULT 100,
  fees_status TEXT DEFAULT 'Pending',
  bus_route TEXT DEFAULT 'Self Pickup',
  image TEXT,
  parent_id TEXT,
  parent_phone TEXT NOT NULL,
  parent_email TEXT,
  address TEXT,
  password TEXT, -- Explicitly included
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  aadhaar_number TEXT,
  email TEXT,
  date_of_joining DATE NOT NULL,
  class_assigned TEXT,
  marital_status TEXT,
  status TEXT DEFAULT 'Active',
  role TEXT NOT NULL,
  image TEXT,
  signature TEXT,
  emergency_contact JSONB,
  salary_details JSONB,
  password TEXT, -- Explicitly included
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- MIGRATION: ENSURE AUTH COLUMNS EXIST
-- ==========================================
DO $$
BEGIN
    BEGIN
        ALTER TABLE students ADD COLUMN password TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE staff ADD COLUMN password TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- ==========================================
-- SEED DATA (Admin & Founders)
-- ==========================================

-- Admin Account
INSERT INTO staff (id, first_name, last_name, name, phone, date_of_joining, role, password, status)
VALUES ('ADMIN-MASTER', 'School', 'Administrator', 'School Administrator', '9940455190', '2025-01-01', 'Admin', 'JO!$@Future', 'Active')
ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password, phone = EXCLUDED.phone;

-- Founders
INSERT INTO staff (id, first_name, last_name, name, phone, date_of_joining, role, password, status)
VALUES 
('FOUNDER-1', 'School', 'Founder', 'School Founder', '9363254437', '2025-01-01', 'Founder', 'JO!$@Founder', 'Active'),
('FOUNDER-2', 'Executive', 'Founder', 'School Founder', '9500001656', '2025-01-01', 'Founder', 'JO!$@Founder', 'Active')
ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password;

-- ==========================================
-- SUPPORTING TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'Pending',
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  parent_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'Pending',
  request_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notices (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  priority TEXT DEFAULT 'Medium',
  content TEXT NOT NULL,
  sender TEXT NOT NULL,
  target_group TEXT DEFAULT 'All',
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  sender_id TEXT,
  receiver_id TEXT,
  sender_name TEXT,
  sender_role TEXT,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  type TEXT DEFAULT 'Private'
);

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  request_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Pending',
  reason TEXT,
  issue_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  present INTEGER DEFAULT 0,
  absent INTEGER DEFAULT 0,
  late INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_logs (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- REALTIME & SECURITY
-- ==========================================

-- Publication check
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Table publication
DO $$
DECLARE
    row record;
BEGIN
    FOR row IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    LOOP
        BEGIN
            EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE ' || quote_ident(row.tablename);
        EXCEPTION WHEN others THEN
            -- Table already in publication or other minor conflict
        END;
    END LOOP;
END $$;

-- RLS & Policies
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
