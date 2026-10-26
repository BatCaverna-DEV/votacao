import { Router } from 'express';
import { listar, buscarPorId, criar, atualizar, remover } from '../controllers/EleitorController.js';
import { autenticar, autorizar } from '../middlewares/auth.js';

const router = Router();

router.use(autenticar, autorizar(1));

router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', remover);

export default router;
