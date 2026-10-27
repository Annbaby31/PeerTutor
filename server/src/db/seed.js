import { db, initDatabase } from '../config/database.js';

export function seedData() {
  console.log('--- Initializing Database Schema ---');
  initDatabase();

  console.log('--- Seeding Initial Peer Tutor Data ---');

  // Clear existing data to ensure idempotent seeding
  db.exec(`
    DELETE FROM session_requests;
    DELETE FROM tutor_subjects;
    DELETE FROM tutor_profiles;
    DELETE FROM subjects;
    DELETE FROM users;
  `);

  // Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, role, avatar_url)
    VALUES (?, ?, ?, ?)
  `);

  // Students
  const student1 = insertUser.run('Alex Rivera', 'alex@college.edu', 'STUDENT', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex');
  const student2 = insertUser.run('Mia Chen', 'mia@college.edu', 'STUDENT', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia');
  const student3 = insertUser.run('Lucas Patel', 'lucas@college.edu', 'STUDENT', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas');

  // Tutors
  const tutor1 = insertUser.run('David Miller', 'david.miller@college.edu', 'TUTOR', 'https://api.dicebear.com/7.x/avataaars/svg?seed=David');
  const tutor2 = insertUser.run('Emily Davis', 'emily.davis@college.edu', 'TUTOR', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily');
  const tutor3 = insertUser.run('Marcus Vance', 'marcus.vance@college.edu', 'TUTOR', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus');
  const tutor4 = insertUser.run('Sophia Rodriguez', 'sophia.r@college.edu', 'TUTOR', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia');

  // Insert Subjects
  const insertSubject = db.prepare(`
    INSERT INTO subjects (name, category)
    VALUES (?, ?)
  `);

  const subDSA = insertSubject.run('Data Structures & Algorithms', 'Computer Science');
  const subWeb = insertSubject.run('Web Development (React & Node)', 'Computer Science');
  const subDB = insertSubject.run('Database Systems & SQL', 'Computer Science');
  const subLinAlg = insertSubject.run('Linear Algebra', 'Mathematics');
  const subCalc = insertSubject.run('Calculus I & II', 'Mathematics');
  const subPhysics = insertSubject.run('Physics: Mechanics & Waves', 'Physics');
  const subOrgChem = insertSubject.run('Organic Chemistry', 'Chemistry');

  // Insert Tutor Profiles
  const insertProfile = db.prepare(`
    INSERT INTO tutor_profiles (user_id, headline, bio, hourly_rate, is_available)
    VALUES (?, ?, ?, ?, ?)
  `);

  const prof1 = insertProfile.run(
    tutor1.lastInsertRowid,
    'Senior CS TA & Algorithmic Thinking Specialist',
    'Specializing in Data Structures, Algorithm analysis, and recursion. Patient coaching for tough technical assignments.',
    20.00,
    1
  );

  const prof2 = insertProfile.run(
    tutor2.lastInsertRowid,
    'Applied Math Honors Student & Calculus Specialist',
    'Simplifying Linear Algebra, Vector Spaces, and Calculus. Focus on intuition and high exam confidence.',
    18.00,
    1
  );

  const prof3 = insertProfile.run(
    tutor3.lastInsertRowid,
    'Full Stack Engineer & Web Dev Mentor',
    'Hands-on pair programming in JavaScript, React, Node.js, and relational databases. Let us build real apps together!',
    25.00,
    1
  );

  const prof4 = insertProfile.run(
    tutor4.lastInsertRowid,
    'Physics TA & Electrical Engineering Sophomore',
    'Demystifying mechanics, wave motion, and calculus-based physics with visual problem-solving approaches.',
    15.00,
    1
  );

  // Link Tutors to Subjects (Many-to-Many)
  const linkSubject = db.prepare(`
    INSERT INTO tutor_subjects (tutor_profile_id, subject_id)
    VALUES (?, ?)
  `);

  // David -> DSA, DB
  linkSubject.run(prof1.lastInsertRowid, subDSA.lastInsertRowid);
  linkSubject.run(prof1.lastInsertRowid, subDB.lastInsertRowid);

  // Emily -> Linear Algebra, Calculus
  linkSubject.run(prof2.lastInsertRowid, subLinAlg.lastInsertRowid);
  linkSubject.run(prof2.lastInsertRowid, subCalc.lastInsertRowid);

  // Marcus -> Web Dev, Database, DSA
  linkSubject.run(prof3.lastInsertRowid, subWeb.lastInsertRowid);
  linkSubject.run(prof3.lastInsertRowid, subDB.lastInsertRowid);
  linkSubject.run(prof3.lastInsertRowid, subDSA.lastInsertRowid);

  // Sophia -> Physics, Calculus
  linkSubject.run(prof4.lastInsertRowid, subPhysics.lastInsertRowid);
  linkSubject.run(prof4.lastInsertRowid, subCalc.lastInsertRowid);

  // Insert Sample Session Requests
  const insertSession = db.prepare(`
    INSERT INTO session_requests (student_id, tutor_id, subject_id, scheduled_at, duration_minutes, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertSession.run(
    student1.lastInsertRowid,
    tutor1.lastInsertRowid,
    subDSA.lastInsertRowid,
    '2026-10-29 16:00',
    60,
    'Need help understanding Binary Search Trees and Big-O recursion depth.',
    'PENDING'
  );

  insertSession.run(
    student2.lastInsertRowid,
    tutor2.lastInsertRowid,
    subLinAlg.lastInsertRowid,
    '2026-10-30 14:00',
    60,
    'Reviewing Eigenvalues, Eigenvectors, and diagonalization before the midterm exam.',
    'ACCEPTED'
  );

  console.log(' Seed completed successfully!');
}

// Allow direct CLI execution
if (process.argv[1]?.endsWith('seed.js')) {
  seedData();
}
