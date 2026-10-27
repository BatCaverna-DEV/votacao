import { Router } from 'express';
import { listar, buscarPorId, criar, atualizar, remover, painel, liberar, cancelarLiberacao } from '../controllers/UrnaController.js';
import { autenticar, autorizar } from '../middlewares/auth.js';

const router = Router();

router.use(autenticar, autorizar(1));

router.get('/', listar);
router.get('/:id', buscarPorId);
router.get('/:id/painel', painel);
router.put('/:id/liberar', liberar);
router.put('/:id/cancelar', cancelarLiberacao);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', remover);

export default router;
