import { Router } from 'express';
import UserController from '../controllers/UserController';

const router = Router();

router.post('/', UserController.createUser);
router.get('/:id', UserController.getUserById);

export default router;
