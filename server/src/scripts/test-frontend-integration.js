import app from '../server.js';
import { seedData } from '../db/seed.js';

const TEST_PORT = 5057;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

console.log('=== Running Frontend-Backend Integrated Interaction Verification ===\n');

seedData();

const server = app.listen(TEST_PORT, async () => {
  try {
    // 1. Verify Users & Switcher personas
    const usersRes = await fetch(`${BASE_URL}/users`);
    const users = await usersRes.json();
    const alex = users.find(u => u.name === 'Alex Rivera');
    const david = users.find(u => u.name === 'David Miller');
    const mia = users.find(u => u.name === 'Mia Chen');
    const emily = users.find(u => u.name === 'Emily Davis');

    if (!alex || !david || !mia || !emily) {
      throw new Error('Required demo personas not found in database');
    }
    console.log('[PASS] Demo personas verified: Student Alex & Mia, Tutor David & Emily');

    // 2. Student Alex searches and requests session with Tutor David
    const tutorSearchRes = await fetch(`${BASE_URL}/tutors?search=David`);
    const searchResults = await tutorSearchRes.json();
    if (searchResults.length === 0 || searchResults[0].userId !== david.id) {
      throw new Error('Search failed to return David Miller');
    }
    const tutorDavid = searchResults[0];
    const targetSubject = tutorDavid.subjects[0];
    console.log(`[PASS] Found Tutor: ${tutorDavid.name} with subject: ${targetSubject.name}`);

    // 3. Create Session Request (Simulating BookingModal)
    const bookRes = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: alex.id,
        tutorId: david.id,
        subjectId: targetSubject.id,
        scheduledAt: '2026-11-02 15:30',
        durationMinutes: 60,
        notes: 'Need assistance preparing for the dynamic programming coding challenge.'
      })
    });
    const sessionAlex = await bookRes.json();
    if (sessionAlex.status !== 'PENDING') throw new Error('Expected initial status PENDING');
    console.log(`[PASS] BookingModal flow: Alex booked session #${sessionAlex.id} with David (status: PENDING)`);

    // 4. Tutor David views incoming requests in Bookings tab
    const davidInboxRes = await fetch(`${BASE_URL}/sessions?userId=${david.id}&asRole=tutor`);
    const davidInbox = await davidInboxRes.json();
    const incomingReq = davidInbox.find(s => s.id === sessionAlex.id);
    if (!incomingReq || incomingReq.status !== 'PENDING') {
      throw new Error('Session request not present in Tutor incoming inbox');
    }
    console.log(`[PASS] Bookings tab (Tutor View): David sees pending request #${incomingReq.id} from ${incomingReq.student.name}`);

    // 5. Tutor David clicks "Accept"
    const acceptRes = await fetch(`${BASE_URL}/sessions/${sessionAlex.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACCEPTED', actorId: david.id })
    });
    const acceptedData = await acceptRes.json();
    if (acceptedData.status !== 'ACCEPTED') throw new Error('Status update to ACCEPTED failed');
    console.log(`[PASS] Tutor Action: David accepted session #${sessionAlex.id}`);

    // 6. Student Alex views "My Bookings" and sees ACCEPTED
    const alexBookingsRes = await fetch(`${BASE_URL}/sessions?userId=${alex.id}&asRole=student`);
    const alexBookings = await alexBookingsRes.json();
    const confirmedReq = alexBookings.find(s => s.id === sessionAlex.id);
    if (!confirmedReq || confirmedReq.status !== 'ACCEPTED') {
      throw new Error('Alex did not see updated ACCEPTED status in My Bookings');
    }
    console.log(`[PASS] Bookings tab (Student View): Alex verified session #${sessionAlex.id} is ACCEPTED`);

    // 7. Test Decline Flow (Mia requests Emily, Emily declines)
    const emilyTutorRes = await fetch(`${BASE_URL}/tutors?search=Emily`);
    const emilyTutor = (await emilyTutorRes.json())[0];
    const emilySubjectId = emilyTutor.subjects[0].id;

    const bookMiaRes = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: mia.id,
        tutorId: emily.id,
        subjectId: emilySubjectId,
        scheduledAt: '2026-11-03 11:00',
        durationMinutes: 45,
        notes: 'Help with matrix decomposition.'
      })
    });

    if (!bookMiaRes.ok) {
      const err = await bookMiaRes.text();
      throw new Error(`Failed to book session for Mia: ${err}`);
    }

    const sessionMia = await bookMiaRes.json();

    const declineRes = await fetch(`${BASE_URL}/sessions/${sessionMia.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REJECTED', actorId: emily.id })
    });

    if (!declineRes.ok) {
      const err = await declineRes.text();
      throw new Error(`Failed to decline session: ${err}`);
    }

    const declinedData = await declineRes.json();
    if (declinedData.status !== 'REJECTED') throw new Error(`Status update to REJECTED failed, got: ${declinedData.status}`);
    console.log(`[PASS] Decline flow: Emily declined session #${sessionMia.id} (Status: REJECTED)`);

    // 8. Tutor Profile Setup/Edit flow
    const updateProfileRes = await fetch(`${BASE_URL}/tutors/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: emily.id,
        headline: 'Lead Mathematics Tutor & Graduate Fellow',
        bio: 'Advanced tutoring in Linear Algebra, Multivariable Calculus, and Numerical Methods.',
        hourlyRate: 24.00,
        isAvailable: 1,
        subjectIds: [4, 5]
      })
    });
    const updatedEmilyProfile = await updateProfileRes.json();
    if (updatedEmilyProfile.headline !== 'Lead Mathematics Tutor & Graduate Fellow') {
      throw new Error('Profile update failed');
    }
    console.log(`[PASS] Tutor Profile Editor: Emily updated headline, rate ($${updatedEmilyProfile.hourly_rate}/hr), and subjects`);

    console.log('\n ALL MILESTONE 4 INTERACTION CHECKS PASSED SUCCESSFULLY!');
    server.close(() => process.exit(0));
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    server.close(() => process.exit(1));
  }
});
