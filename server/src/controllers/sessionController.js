import { db } from '../config/database.js';

export const sessionController = {
  // Get sessions, filterable by user and role perspective
  getSessions: (req, res) => {
    try {
      const { userId, asRole, status } = req.query;

      let query = `
        SELECT 
          sr.id,
          sr.student_id,
          s_user.name AS student_name,
          s_user.email AS student_email,
          s_user.avatar_url AS student_avatar,
          sr.tutor_id,
          t_user.name AS tutor_name,
          t_user.email AS tutor_email,
          t_user.avatar_url AS tutor_avatar,
          sr.subject_id,
          sub.name AS subject_name,
          sub.category AS subject_category,
          sr.scheduled_at,
          sr.duration_minutes,
          sr.notes,
          sr.status,
          sr.created_at,
          sr.updated_at
        FROM session_requests sr
        JOIN users s_user ON sr.student_id = s_user.id
        JOIN users t_user ON sr.tutor_id = t_user.id
        JOIN subjects sub ON sr.subject_id = sub.id
        WHERE 1=1
      `;
      const params = [];

      if (userId) {
        const uId = Number(userId);
        if (asRole === 'student') {
          query += ` AND sr.student_id = ?`;
          params.push(uId);
        } else if (asRole === 'tutor') {
          query += ` AND sr.tutor_id = ?`;
          params.push(uId);
        } else {
          query += ` AND (sr.student_id = ? OR sr.tutor_id = ?)`;
          params.push(uId, uId);
        }
      }

      if (status) {
        query += ` AND sr.status = ?`;
        params.push(status.toUpperCase());
      }

      query += ` ORDER BY sr.id DESC`;

      const rows = db.prepare(query).all(...params);

      // Structure response cleanly
      const sessions = rows.map(r => ({
        id: r.id,
        scheduledAt: r.scheduled_at,
        durationMinutes: r.duration_minutes,
        notes: r.notes,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        student: {
          id: r.student_id,
          name: r.student_name,
          email: r.student_email,
          avatarUrl: r.student_avatar
        },
        tutor: {
          id: r.tutor_id,
          name: r.tutor_name,
          email: r.tutor_email,
          avatarUrl: r.tutor_avatar
        },
        subject: {
          id: r.subject_id,
          name: r.subject_name,
          category: r.subject_category
        }
      }));

      res.json(sessions);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve sessions', details: err.message });
    }
  },

  // Student requests a session
  createSession: (req, res) => {
    try {
      const { studentId, tutorId, subjectId, scheduledAt, durationMinutes = 60, notes = '' } = req.body;

      if (!studentId || !tutorId || !subjectId || !scheduledAt) {
        return res.status(400).json({
          error: 'studentId, tutorId, subjectId, and scheduledAt are required'
        });
      }

      const sId = Number(studentId);
      const tId = Number(tutorId);
      const subId = Number(subjectId);

      if (sId === tId) {
        return res.status(400).json({ error: 'A user cannot request a tutoring session with themselves' });
      }

      // Check student exists
      const student = db.prepare('SELECT id, name FROM users WHERE id = ?').get(sId);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Check tutor exists
      const tutor = db.prepare('SELECT id, name FROM users WHERE id = ?').get(tId);
      if (!tutor) {
        return res.status(404).json({ error: 'Tutor not found' });
      }

      // Check subject exists
      const subject = db.prepare('SELECT id, name FROM subjects WHERE id = ?').get(subId);
      if (!subject) {
        return res.status(404).json({ error: 'Subject not found' });
      }

      // Validate date
      const parsedDate = new Date(scheduledAt);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid scheduledAt format. Expected valid date string.' });
      }

      // Insert new request with PENDING status
      const stmt = db.prepare(`
        INSERT INTO session_requests (student_id, tutor_id, subject_id, scheduled_at, duration_minutes, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
      `);

      const result = stmt.run(sId, tId, subId, scheduledAt.trim(), Number(durationMinutes), notes.trim());

      // Fetch created session
      const createdRow = db.prepare(`
        SELECT 
          sr.id, sr.student_id, s_user.name AS student_name, s_user.email AS student_email, s_user.avatar_url AS student_avatar,
          sr.tutor_id, t_user.name AS tutor_name, t_user.email AS tutor_email, t_user.avatar_url AS tutor_avatar,
          sr.subject_id, sub.name AS subject_name, sub.category AS subject_category,
          sr.scheduled_at, sr.duration_minutes, sr.notes, sr.status, sr.created_at, sr.updated_at
        FROM session_requests sr
        JOIN users s_user ON sr.student_id = s_user.id
        JOIN users t_user ON sr.tutor_id = t_user.id
        JOIN subjects sub ON sr.subject_id = sub.id
        WHERE sr.id = ?
      `).get(result.lastInsertRowid);

      res.status(201).json({
        id: createdRow.id,
        scheduledAt: createdRow.scheduled_at,
        durationMinutes: createdRow.duration_minutes,
        notes: createdRow.notes,
        status: createdRow.status,
        createdAt: createdRow.created_at,
        updatedAt: createdRow.updated_at,
        student: {
          id: createdRow.student_id,
          name: createdRow.student_name,
          email: createdRow.student_email,
          avatarUrl: createdRow.student_avatar
        },
        tutor: {
          id: createdRow.tutor_id,
          name: createdRow.tutor_name,
          email: createdRow.tutor_email,
          avatarUrl: createdRow.tutor_avatar
        },
        subject: {
          id: createdRow.subject_id,
          name: createdRow.subject_name,
          category: createdRow.subject_category
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create session request', details: err.message });
    }
  },

  // Update session status (ACCEPT, REJECT, CANCEL)
  updateStatus: (req, res) => {
    try {
      const { id } = req.params;
      const { status, actorId } = req.body;

      const validStatuses = ['ACCEPTED', 'REJECTED', 'CANCELLED'];
      if (!status || !validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({
          error: `Invalid status. Allowed values: ${validStatuses.join(', ')}`
        });
      }

      const targetStatus = status.toUpperCase();

      // Find session
      const session = db.prepare('SELECT * FROM session_requests WHERE id = ?').get(Number(id));
      if (!session) {
        return res.status(404).json({ error: 'Session request not found' });
      }

      // Check current status - terminal states cannot be changed
      if (['REJECTED', 'CANCELLED'].includes(session.status)) {
        return res.status(400).json({
          error: `Cannot change status of a session that is already ${session.status}`
        });
      }

      // Authorization / Role validation:
      // Tutors can ACCEPT or REJECT
      // Students can CANCEL
      if (actorId) {
        const actor = Number(actorId);
        if (targetStatus === 'ACCEPTED' || targetStatus === 'REJECTED') {
          if (actor !== session.tutor_id) {
            return res.status(403).json({
              error: 'Only the requested tutor has permission to accept or reject this session'
            });
          }
        } else if (targetStatus === 'CANCELLED') {
          if (actor !== session.student_id && actor !== session.tutor_id) {
            return res.status(403).json({
              error: 'Only the student or tutor can cancel this session'
            });
          }
        }
      }

      // Perform update
      db.prepare(`
        UPDATE session_requests 
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(targetStatus, session.id);

      // Return updated record
      const updatedRow = db.prepare(`
        SELECT 
          sr.id, sr.student_id, s_user.name AS student_name, s_user.email AS student_email, s_user.avatar_url AS student_avatar,
          sr.tutor_id, t_user.name AS tutor_name, t_user.email AS tutor_email, t_user.avatar_url AS tutor_avatar,
          sr.subject_id, sub.name AS subject_name, sub.category AS subject_category,
          sr.scheduled_at, sr.duration_minutes, sr.notes, sr.status, sr.created_at, sr.updated_at
        FROM session_requests sr
        JOIN users s_user ON sr.student_id = s_user.id
        JOIN users t_user ON sr.tutor_id = t_user.id
        JOIN subjects sub ON sr.subject_id = sub.id
        WHERE sr.id = ?
      `).get(session.id);

      res.json({
        id: updatedRow.id,
        scheduledAt: updatedRow.scheduled_at,
        durationMinutes: updatedRow.duration_minutes,
        notes: updatedRow.notes,
        status: updatedRow.status,
        createdAt: updatedRow.created_at,
        updatedAt: updatedRow.updated_at,
        student: {
          id: updatedRow.student_id,
          name: updatedRow.student_name,
          email: updatedRow.student_email,
          avatarUrl: updatedRow.student_avatar
        },
        tutor: {
          id: updatedRow.tutor_id,
          name: updatedRow.tutor_name,
          email: updatedRow.tutor_email,
          avatarUrl: updatedRow.tutor_avatar
        },
        subject: {
          id: updatedRow.subject_id,
          name: updatedRow.subject_name,
          category: updatedRow.subject_category
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update session status', details: err.message });
    }
  }
};
