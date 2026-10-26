import { Router } from 'express';
import { conectar, identificar, votar } from '../controllers/VotacaoController.js';

// Rotas da urna eletrônica (sem login de administrador; a urna se identifica pelo ID)
const router = Router();

router.post('/conectar', conectar);
router.post('/identificar', identificar);
router.post('/votar', votar);

export default router;
