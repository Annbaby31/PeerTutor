import { db } from '../config/database.js';

export const userController = {
  // Get all users (useful for role switcher in UI demo)
  getAllUsers: (req, res) => {
    try {
      const users = db.prepare(`
        SELECT id, name, email, role, avatar_url, created_at 
        FROM users 
        ORDER BY id ASC
      `).all();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve users', details: err.message });
    }
  },

  // Get user by id
  getUserById: (req, res) => {
    try {
      const { id } = req.params;
      const user = db.prepare(`
        SELECT id, name, email, role, avatar_url, created_at 
        FROM users 
        WHERE id = ?
      `).get(Number(id));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // If user is a tutor, fetch tutor profile and subjects
      let tutorProfile = null;
      if (user.role === 'TUTOR' || user.role === 'BOTH') {
        const profile = db.prepare(`
          SELECT id, headline, bio, hourly_rate, is_available 
          FROM tutor_profiles 
          WHERE user_id = ?
        `).get(user.id);

        if (profile) {
          const subjects = db.prepare(`
            SELECT s.id, s.name, s.category
            FROM subjects s
            JOIN tutor_subjects ts ON ts.subject_id = s.id
            WHERE ts.tutor_profile_id = ?
          `).all(profile.id);

          tutorProfile = { ...profile, subjects };
        }
      }

      res.json({ ...user, tutorProfile });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve user', details: err.message });
    }
  },

  // Register a new user
  createUser: (req, res) => {
    try {
      const { name, email, role = 'STUDENT', avatar_url } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      const validRoles = ['STUDENT', 'TUTOR', 'BOTH'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
      }

      const defaultAvatar = avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

      const stmt = db.prepare(`
        INSERT INTO users (name, email, role, avatar_url)
        VALUES (?, ?, ?, ?)
      `);
      const result = stmt.run(name.trim(), email.trim().toLowerCase(), role, defaultAvatar);

      const newUser = db.prepare(`
        SELECT id, name, email, role, avatar_url, created_at 
        FROM users WHERE id = ?
      `).get(result.lastInsertRowid);

      res.status(201).json(newUser);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'A user with this email already exists' });
      }
      res.status(500).json({ error: 'Failed to create user', details: err.message });
    }
  }
};
