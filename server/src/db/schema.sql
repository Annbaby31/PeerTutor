PRAGMA foreign_keys = ON;

-- Users table (students and tutors)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('STUDENT', 'TUTOR', 'BOTH')),
  avatar_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Academic Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL
);

-- Tutor Profiles
CREATE TABLE IF NOT EXISTS tutor_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  bio TEXT NOT NULL,
  hourly_rate REAL DEFAULT 0.00,
  is_available INTEGER DEFAULT 1 CHECK(is_available IN (0, 1)),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Tutor Subjects junction table (Many-to-Many)
CREATE TABLE IF NOT EXISTS tutor_subjects (
  tutor_profile_id INTEGER NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (tutor_profile_id, subject_id)
);

-- Session Requests / Bookings
CREATE TABLE IF NOT EXISTS session_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  scheduled_at TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
