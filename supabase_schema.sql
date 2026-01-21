
-- ==========================================
-- STORAGE CONFIGURATION
-- ==========================================

-- Create the 'students' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('students', 'students', true)
ON CONFLICT (id) DO NOTHING;

-- Create the 'staff' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('staff', 'staff', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access policies for the 'students' bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'students');

DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
CREATE POLICY "Public Upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'students');

DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'students');

DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'students');

-- Set up access policies for the 'staff' bucket
DROP POLICY IF EXISTS "Staff Public Access" ON storage.objects;
CREATE POLICY "Staff Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'staff');

DROP POLICY IF EXISTS "Staff Public Upload" ON storage.objects;
CREATE POLICY "Staff Public Upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'staff');

DROP POLICY IF EXISTS "Staff Public Update" ON storage.objects;
CREATE POLICY "Staff Public Update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'staff');

DROP POLICY IF EXISTS "Staff Public Delete" ON storage.objects;
CREATE POLICY "Staff Public Delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'staff');


-- ==========================================
-- MIGRATION: RUN THIS IF YOU HAVE EXISTING TABLES
-- ==========================================

-- Students Table Migrations
ALTER TABLE students ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS middle_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_email TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_email TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_email TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS program TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_joining DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS offer TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS fees_status TEXT DEFAULT 'Pending';
ALTER TABLE students ADD COLUMN IF NOT EXISTS bus_route TEXT DEFAULT 'Not Assigned';
ALTER TABLE students ADD COLUMN IF NOT EXISTS image TEXT;

-- Remove NOT NULL constraints from grade and section as they are deprecated
ALTER TABLE students ALTER COLUMN grade DROP NOT NULL;
ALTER TABLE students ALTER COLUMN section DROP NOT NULL;

-- Staff Table Migrations
ALTER TABLE staff ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS middle_name TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS emergency_contact JSONB;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS salary_details JSONB;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS signature TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS aadhaar_number TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS date_of_joining DATE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS marital_status TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS class_assigned TEXT;

-- ==========================================
-- FULL SCHEMA DEFINITION (FRESH START)
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
  program TEXT NOT NULL,
  date_of_joining DATE NOT NULL,
  offer TEXT,
  grade TEXT, 
  section TEXT, 
  emergency_contact JSONB,
  attendance NUMERIC DEFAULT 100,
  fees_status TEXT DEFAULT 'Pending',
  bus_route TEXT DEFAULT 'Not Assigned',
  image TEXT,
  parent_id TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices Table
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

-- Leave Requests Table
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

-- Notices Table
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

-- Chats Table
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

-- Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  request_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Requested',
  reason TEXT,
  issue_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Records (Summary)
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  present INTEGER DEFAULT 0,
  absent INTEGER DEFAULT 0,
  late INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Submitted',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Logs (Individual)
CREATE TABLE IF NOT EXISTS attendance_logs (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  student_id REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE REALTIME
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE students, staff, invoices, leave_requests, notices, chats, certificates, attendance_records, attendance_logs;

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- Creating simple policies for development access
CREATE POLICY "Public Access Student" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Staff" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Leaves" ON leave_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Notices" ON notices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Chats" ON chats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Certs" ON certificates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access AttRec" ON attendance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access AttLog" ON attendance_logs FOR ALL USING (true) WITH CHECK (true);
