import { Router } from 'express';
import { identificar, votar } from '../controllers/TerminalController.js';

const router = Router();

router.post('/identificar', identificar);
router.post('/votar', votar);

export default router;
