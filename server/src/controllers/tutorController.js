import { db } from '../config/database.js';

export const tutorController = {
  // Browse tutors with optional subject filter and search query
  getTutors: (req, res) => {
    try {
      const { subjectId, search } = req.query;

      let query = `
        SELECT 
          tp.id AS tutor_profile_id,
          u.id AS user_id,
          u.name,
          u.email,
          u.avatar_url,
          tp.headline,
          tp.bio,
          tp.hourly_rate,
          tp.is_available,
          tp.created_at
        FROM tutor_profiles tp
        JOIN users u ON tp.user_id = u.id
        WHERE tp.is_available = 1
      `;
      const params = [];

      if (subjectId) {
        query += `
          AND tp.id IN (
            SELECT ts.tutor_profile_id 
            FROM tutor_subjects ts 
            WHERE ts.subject_id = ?
          )
        `;
        params.push(Number(subjectId));
      }

      if (search && search.trim() !== '') {
        const term = `%${search.trim()}%`;
        query += `
          AND (
            u.name LIKE ? 
            OR tp.headline LIKE ? 
            OR tp.bio LIKE ?
            OR tp.id IN (
              SELECT ts2.tutor_profile_id
              FROM tutor_subjects ts2
              JOIN subjects s ON ts2.subject_id = s.id
              WHERE s.name LIKE ?
            )
          )
        `;
        params.push(term, term, term, term);
      }

      query += ` ORDER BY u.name ASC`;

      const tutors = db.prepare(query).all(...params);

      // Fetch subjects for each tutor
      const getSubjectsStmt = db.prepare(`
        SELECT s.id, s.name, s.category
        FROM subjects s
        JOIN tutor_subjects ts ON ts.subject_id = s.id
        WHERE ts.tutor_profile_id = ?
        ORDER BY s.name ASC
      `);

      const tutorsWithSubjects = tutors.map(tutor => {
        const subjects = getSubjectsStmt.all(tutor.tutor_profile_id);
        return {
          id: tutor.tutor_profile_id,
          userId: tutor.user_id,
          name: tutor.name,
          email: tutor.email,
          avatarUrl: tutor.avatar_url,
          headline: tutor.headline,
          bio: tutor.bio,
          hourlyRate: tutor.hourly_rate,
          isAvailable: Boolean(tutor.is_available),
          subjects
        };
      });

      res.json(tutorsWithSubjects);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve tutors', details: err.message });
    }
  },

  // Get single tutor profile by tutor profile ID or user ID
  getTutorById: (req, res) => {
    try {
      const { id } = req.params;
      const tutor = db.prepare(`
        SELECT 
          tp.id AS tutor_profile_id,
          u.id AS user_id,
          u.name,
          u.email,
          u.avatar_url,
          tp.headline,
          tp.bio,
          tp.hourly_rate,
          tp.is_available,
          tp.created_at
        FROM tutor_profiles tp
        JOIN users u ON tp.user_id = u.id
        WHERE tp.id = ? OR tp.user_id = ?
      `).get(Number(id), Number(id));

      if (!tutor) {
        return res.status(404).json({ error: 'Tutor not found' });
      }

      const subjects = db.prepare(`
        SELECT s.id, s.name, s.category
        FROM subjects s
        JOIN tutor_subjects ts ON ts.subject_id = s.id
        WHERE ts.tutor_profile_id = ?
      `).all(tutor.tutor_profile_id);

      res.json({
        id: tutor.tutor_profile_id,
        userId: tutor.user_id,
        name: tutor.name,
        email: tutor.email,
        avatarUrl: tutor.avatar_url,
        headline: tutor.headline,
        bio: tutor.bio,
        hourlyRate: tutor.hourly_rate,
        isAvailable: Boolean(tutor.is_available),
        subjects
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve tutor', details: err.message });
    }
  },

  // Create or update a tutor's profile and subject mappings
  upsertProfile: (req, res) => {
    try {
      const { userId, headline, bio, hourlyRate = 0, isAvailable = 1, subjectIds = [] } = req.body;

      if (!userId || !headline || !bio) {
        return res.status(400).json({ error: 'userId, headline, and bio are required' });
      }

      // Check if user exists
      const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(Number(userId));
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if profile exists
      let profile = db.prepare('SELECT id FROM tutor_profiles WHERE user_id = ?').get(Number(userId));
      let profileId;

      if (profile) {
        // Update existing profile
        db.prepare(`
          UPDATE tutor_profiles 
          SET headline = ?, bio = ?, hourly_rate = ?, is_available = ?
          WHERE id = ?
        `).run(headline.trim(), bio.trim(), Number(hourlyRate), isAvailable ? 1 : 0, profile.id);
        profileId = profile.id;
      } else {
        // Create new profile
        const result = db.prepare(`
          INSERT INTO tutor_profiles (user_id, headline, bio, hourly_rate, is_available)
          VALUES (?, ?, ?, ?, ?)
        `).run(Number(userId), headline.trim(), bio.trim(), Number(hourlyRate), isAvailable ? 1 : 0);
        profileId = result.lastInsertRowid;

        // Ensure user role reflects tutor status
        if (user.role === 'STUDENT') {
          db.prepare(`UPDATE users SET role = 'BOTH' WHERE id = ?`).run(user.id);
        }
      }

      // Synchronize subjects: delete existing mappings and insert new ones
      db.prepare(`DELETE FROM tutor_subjects WHERE tutor_profile_id = ?`).run(profileId);

      if (Array.isArray(subjectIds) && subjectIds.length > 0) {
        const insertLink = db.prepare(`INSERT INTO tutor_subjects (tutor_profile_id, subject_id) VALUES (?, ?)`);
        for (const sId of subjectIds) {
          try {
            insertLink.run(profileId, Number(sId));
          } catch (e) {
            // Ignore duplicate or foreign key errors for robust edge case handling
          }
        }
      }

      // Return updated profile with subjects
      const updatedProfile = db.prepare(`
        SELECT 
          tp.id, tp.user_id, tp.headline, tp.bio, tp.hourly_rate, tp.is_available,
          u.name, u.email, u.avatar_url
        FROM tutor_profiles tp
        JOIN users u ON tp.user_id = u.id
        WHERE tp.id = ?
      `).get(profileId);

      const subjects = db.prepare(`
        SELECT s.id, s.name, s.category
        FROM subjects s
        JOIN tutor_subjects ts ON ts.subject_id = s.id
        WHERE ts.tutor_profile_id = ?
      `).all(profileId);

      res.status(profile ? 200 : 201).json({
        ...updatedProfile,
        subjects
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save tutor profile', details: err.message });
    }
  }
};
