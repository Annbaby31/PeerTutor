import { db } from '../config/database.js';

export const subjectController = {
  // Get all subjects
  getAllSubjects: (req, res) => {
    try {
      const subjects = db.prepare(`
        SELECT 
          s.id, 
          s.name, 
          s.category,
          COUNT(ts.tutor_profile_id) AS tutor_count
        FROM subjects s
        LEFT JOIN tutor_subjects ts ON ts.subject_id = s.id
        GROUP BY s.id
        ORDER BY s.category ASC, s.name ASC
      `).all();

      res.json(subjects);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve subjects', details: err.message });
    }
  },

  // Create a subject
  createSubject: (req, res) => {
    try {
      const { name, category } = req.body;
      if (!name || !category) {
        return res.status(400).json({ error: 'Subject name and category are required' });
      }

      const stmt = db.prepare(`INSERT INTO subjects (name, category) VALUES (?, ?)`);
      const result = stmt.run(name.trim(), category.trim());

      const newSubject = db.prepare(`SELECT * FROM subjects WHERE id = ?`).get(result.lastInsertRowid);
      res.status(201).json(newSubject);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Subject already exists' });
      }
      res.status(500).json({ error: 'Failed to create subject', details: err.message });
    }
  }
};
