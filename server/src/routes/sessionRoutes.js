import express from 'express';
import { sessionController } from '../controllers/sessionController.js';
import { validateBody } from '../middlewares/validate.js';

const router = express.Router();

router.get('/', sessionController.getSessions);
router.post('/', validateBody(['studentId', 'tutorId', 'subjectId', 'scheduledAt']), sessionController.createSession);
router.patch('/:id/status', validateBody(['status']), sessionController.updateStatus);

export default router;
