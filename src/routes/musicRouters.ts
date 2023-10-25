import { Router } from 'express';
import MusicController from '../controllers/MusicController';

const router = Router();

// Exemplo de rotas de música
router.post('/', MusicController.uploadMusic);
router.get('/:id', MusicController.getMusicById);

export default router;
