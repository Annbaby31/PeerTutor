import express from 'express';
import { userController } from '../controllers/userController.js';
import { validateBody } from '../middlewares/validate.js';

const router = express.Router();

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', validateBody(['name', 'email']), userController.createUser);

export default router;
