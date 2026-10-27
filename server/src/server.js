import express from 'express';
import cors from 'cors';
import { initDatabase } from './config/database.js';

import userRoutes from './routes/userRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import tutorRoutes from './routes/tutorRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database schema
initDatabase();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Online Peer Tutor Platform API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/sessions', sessionRoutes);

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(` Tutor Platform Server running on http://localhost:${PORT}`);
  });
}

export default app;
