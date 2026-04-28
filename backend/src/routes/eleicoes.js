import { Router } from 'express';
import { listar, buscarPorId, criar, atualizar, remover, resultado } from '../controllers/EleicaoController.js';
import { autenticar, autorizar } from '../middlewares/auth.js';

const router = Router();

router.use(autenticar);

// Admin e Eleitor podem listar e ver detalhes
router.get('/', autorizar(1, 2), listar);
router.get('/:id', autorizar(1, 2), buscarPorId);
router.get('/:id/resultado', autorizar(1, 2), resultado);

// Apenas Admin gerencia eleições
router.post('/', autorizar(1), criar);
router.put('/:id', autorizar(1), atualizar);
router.delete('/:id', autorizar(1), remover);

export default router;
