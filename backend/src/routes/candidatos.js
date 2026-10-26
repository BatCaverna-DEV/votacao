import { Router } from 'express';
import { listar, buscarPorId, criar, atualizar, remover } from '../controllers/CandidatoController.js';
import { autenticar, autorizar } from '../middlewares/auth.js';
import { uploadFoto } from '../middlewares/upload.js';

const router = Router();

router.use(autenticar, autorizar(1));

router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', uploadFoto, criar);
router.put('/:id', uploadFoto, atualizar);
router.delete('/:id', remover);

export default router;
