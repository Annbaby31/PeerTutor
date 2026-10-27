import app from '../server.js';
import { seedData } from '../db/seed.js';

const TEST_PORT = 5056;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

console.log('=== Running End-to-End API Integration & Flow Test ===\n');

// 1. Seed fresh database
seedData();

const server = app.listen(TEST_PORT, async () => {
  try {
    // Step 1: Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    if (health.status !== 'ok') throw new Error('Health check failed');
    console.log('[PASS] Step 1: Health check OK');

    // Step 2: Fetch Users & identify Student Alex and Tutor David
    const usersRes = await fetch(`${BASE_URL}/users`);
    const users = await usersRes.json();
    const studentAlex = users.find(u => u.name.includes('Alex'));
    const tutorDavid = users.find(u => u.name.includes('David'));

    if (!studentAlex || !tutorDavid) {
      throw new Error('Could not find Alex Rivera or David Miller in seeded users');
    }
    console.log(`[PASS] Step 2: Found Student (id=${studentAlex.id}, ${studentAlex.name}) & Tutor (id=${tutorDavid.id}, ${tutorDavid.name})`);

    // Step 3: Fetch Subjects
    const subjectsRes = await fetch(`${BASE_URL}/subjects`);
    const subjects = await subjectsRes.json();
    const dsaSubject = subjects.find(s => s.name.includes('Data Structures'));
    if (!dsaSubject) throw new Error('Data Structures & Algorithms subject missing');
    console.log(`[PASS] Step 3: Subjects fetched (Count: ${subjects.length}, Target: "${dsaSubject.name}" id=${dsaSubject.id})`);

    // Step 4: Browse Tutors with Subject Filter
    const tutorsFilteredRes = await fetch(`${BASE_URL}/tutors?subjectId=${dsaSubject.id}`);
    const tutorsInDSA = await tutorsFilteredRes.json();
    const isDavidInDSA = tutorsInDSA.some(t => t.userId === tutorDavid.id);
    if (!isDavidInDSA) throw new Error('Tutor David should be in the filtered DSA tutors list');
    console.log(`[PASS] Step 4: Subject filter verified (${tutorsInDSA.length} tutors teach "${dsaSubject.name}")`);

    // Step 5: Student Alex requests a tutoring session with Tutor David
    console.log('\n--- Initiating Session Request Flow ---');
    const newSessionPayload = {
      studentId: studentAlex.id,
      tutorId: tutorDavid.id,
      subjectId: dsaSubject.id,
      scheduledAt: '2026-11-01 10:00',
      durationMinutes: 60,
      notes: 'Need mentor coaching on Dynamic Programming memoization and DAGs.'
    };

    const createSessionRes = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSessionPayload)
    });

    if (!createSessionRes.ok) {
      const errText = await createSessionRes.text();
      throw new Error(`Session creation failed: ${errText}`);
    }

    const createdSession = await createSessionRes.json();
    if (createdSession.status !== 'PENDING') {
      throw new Error(`Expected status PENDING, got ${createdSession.status}`);
    }
    console.log(`[PASS] Step 5: Student requested session #${createdSession.id} with status: [${createdSession.status}]`);

    // Step 6: Tutor David checks pending requests
    const tutorSessionsRes = await fetch(`${BASE_URL}/sessions?userId=${tutorDavid.id}&asRole=tutor`);
    const tutorSessions = await tutorSessionsRes.json();
    const foundInTutorInbox = tutorSessions.find(s => s.id === createdSession.id);

    if (!foundInTutorInbox || foundInTutorInbox.status !== 'PENDING') {
      throw new Error('Created session not found in Tutor David inbox as PENDING');
    }
    console.log(`[PASS] Step 6: Tutor David retrieved incoming session request #${createdSession.id} from ${foundInTutorInbox.student.name}`);

    // Step 7: Authorization edge case test
    // Student Alex attempts to accept their own request (should be forbidden: 403)
    const unauthorizedAcceptRes = await fetch(`${BASE_URL}/sessions/${createdSession.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACCEPTED', actorId: studentAlex.id })
    });

    if (unauthorizedAcceptRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for unauthorized accept, got ${unauthorizedAcceptRes.status}`);
    }
    console.log('[PASS] Step 7: Authorization check prevented student from accepting their own request (403)');

    // Step 8: Tutor David accepts the session request
    const tutorAcceptRes = await fetch(`${BASE_URL}/sessions/${createdSession.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACCEPTED', actorId: tutorDavid.id })
    });

    if (!tutorAcceptRes.ok) {
      const err = await tutorAcceptRes.text();
      throw new Error(`Tutor accept failed: ${err}`);
    }

    const acceptedSession = await tutorAcceptRes.json();
    if (acceptedSession.status !== 'ACCEPTED') {
      throw new Error(`Expected status ACCEPTED, got ${acceptedSession.status}`);
    }
    console.log(`[PASS] Step 8: Tutor David accepted session #${createdSession.id} (Status: [${acceptedSession.status}])`);

    // Step 9: Student Alex checks their bookings and verifies status is ACCEPTED
    const studentSessionsRes = await fetch(`${BASE_URL}/sessions?userId=${studentAlex.id}&asRole=student`);
    const studentSessions = await studentSessionsRes.json();
    const updatedInStudentView = studentSessions.find(s => s.id === createdSession.id);

    if (!updatedInStudentView || updatedInStudentView.status !== 'ACCEPTED') {
      throw new Error(`Student Alex did not see status ACCEPTED (got ${updatedInStudentView?.status})`);
    }
    console.log(`[PASS] Step 9: Student Alex confirmed session #${createdSession.id} status is now [${updatedInStudentView.status}]`);

    // Step 10: Tutor Profile Update verification
    const updateProfileRes = await fetch(`${BASE_URL}/tutors/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: tutorDavid.id,
        headline: 'Lead Algorithm Mentor & CS Honor Society TA',
        bio: 'Updated bio: Offering targeted interview prep and graph theory coaching.',
        hourlyRate: 22.50,
        isAvailable: 1,
        subjectIds: [dsaSubject.id]
      })
    });

    const updatedProfile = await updateProfileRes.json();
    if (updatedProfile.hourly_rate !== 22.50) {
      throw new Error(`Profile rate update failed: expected 22.50, got ${updatedProfile.hourly_rate}`);
    }
    console.log(`[PASS] Step 10: Tutor Profile updated successfully (New rate: $${updatedProfile.hourly_rate}/hr)`);

    console.log('\n ALL 10 REST API INTEGRATION STEPS PASSED WITH FLYING COLORS!');
    server.close(() => process.exit(0));
  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error.message);
    server.close(() => process.exit(1));
  }
});
