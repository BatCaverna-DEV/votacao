import { Router } from 'express';
import { conectar, desconectar, votar } from '../controllers/VotacaoController.js';

// Rotas da urna eletrônica (sem login de administrador; a urna se identifica pelo ID)
const router = Router();

router.post('/conectar', conectar);
router.post('/desconectar', desconectar);
router.post('/votar', votar);

export default router;
