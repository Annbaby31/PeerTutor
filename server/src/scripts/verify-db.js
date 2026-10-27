import { db } from '../config/database.js';
import { seedData } from '../db/seed.js';

console.log('=== Running Database Integrity & Query Verification ===\n');

try {
  // 1. Seed database
  seedData();

  // 2. Verify Users
  const users = db.prepare('SELECT id, name, email, role FROM users').all();
  console.log(`[PASS] Users count: ${users.length} (Expected >= 7)`);
  if (users.length < 7) throw new Error('Insufficient users seeded');

  // 3. Verify Subjects
  const subjects = db.prepare('SELECT id, name, category FROM subjects').all();
  console.log(`[PASS] Subjects count: ${subjects.length} (Expected >= 7)`);
  if (subjects.length < 7) throw new Error('Insufficient subjects seeded');

  // 4. Verify Tutor Profiles with Relational Join to Subjects
  const tutors = db.prepare(`
    SELECT 
      tp.id AS tutor_profile_id,
      u.name,
      u.email,
      tp.headline,
      tp.hourly_rate,
      GROUP_CONCAT(s.name, ', ') AS subjects_taught
    FROM tutor_profiles tp
    JOIN users u ON tp.user_id = u.id
    LEFT JOIN tutor_subjects ts ON ts.tutor_profile_id = tp.id
    LEFT JOIN subjects s ON ts.subject_id = s.id
    GROUP BY tp.id
  `).all();

  console.log(`[PASS] Tutors with joined subjects count: ${tutors.length}`);
  tutors.forEach(t => {
    console.log(`  - Tutor: ${t.name} | Rate: $${t.hourly_rate}/hr | Subjects: [${t.subjects_taught}]`);
    if (!t.subjects_taught) throw new Error(`Tutor ${t.name} has no subjects linked!`);
  });

  // 5. Verify Session Requests with Multi-Table Joins
  const sessions = db.prepare(`
    SELECT 
      sr.id,
      s_user.name AS student_name,
      t_user.name AS tutor_name,
      sub.name AS subject_name,
      sr.scheduled_at,
      sr.status
    FROM session_requests sr
    JOIN users s_user ON sr.student_id = s_user.id
    JOIN users t_user ON sr.tutor_id = t_user.id
    JOIN subjects sub ON sr.subject_id = sub.id
  `).all();

  console.log(`\n[PASS] Session requests count: ${sessions.length}`);
  sessions.forEach(s => {
    console.log(`  - Session #${s.id}: ${s.student_name} -> ${s.tutor_name} for "${s.subject_name}" [Status: ${s.status}]`);
  });

  // 6. Test Status Mutation (PENDING -> ACCEPTED)
  const pendingSession = sessions.find(s => s.status === 'PENDING');
  if (!pendingSession) throw new Error('No pending session found to test mutation');

  db.prepare(`UPDATE session_requests SET status = ?, updated_at = datetime('now') WHERE id = ?`).run('ACCEPTED', pendingSession.id);
  const updatedSession = db.prepare('SELECT status FROM session_requests WHERE id = ?').get(pendingSession.id);

  if (updatedSession.status !== 'ACCEPTED') {
    throw new Error(`Failed to update status: expected ACCEPTED, got ${updatedSession.status}`);
  }
  console.log(`[PASS] Successfully mutated session #${pendingSession.id} to status: ${updatedSession.status}`);

  console.log('\n ALL DATABASE CHECKS PASSED SUCCESSFULLY!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ DATABASE VERIFICATION FAILED:', error.message);
  process.exit(1);
}
