import express from 'express';
import { subjectController } from '../controllers/subjectController.js';
import { validateBody } from '../middlewares/validate.js';

const router = express.Router();

router.get('/', subjectController.getAllSubjects);
router.post('/', validateBody(['name', 'category']), subjectController.createSubject);

export default router;
