import express from 'express';
import { tutorController } from '../controllers/tutorController.js';
import { validateBody } from '../middlewares/validate.js';

const router = express.Router();

router.get('/', tutorController.getTutors);
router.get('/:id', tutorController.getTutorById);
router.post('/profile', validateBody(['userId', 'headline', 'bio']), tutorController.upsertProfile);

export default router;
