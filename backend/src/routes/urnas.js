import { Router } from 'express';
import { listar, buscarPorId, criar, atualizar, remover, votosUrna, apurar } from '../controllers/UrnaController.js';
import { autenticar, autorizar } from '../middlewares/auth.js';

const router = Router();

router.use(autenticar, autorizar(1));

router.get('/', listar);
router.get('/:id', buscarPorId);
router.get('/:id/votos', votosUrna);
router.post('/', criar);
router.put('/:id', atualizar);
router.put('/:id/apurar', apurar);
router.delete('/:id', remover);

export default router;
