import { Router } from 'express';
import { listar, buscarPorId, criar, atualizar, remover } from '../controllers/CandidatoController.js';
import { autenticar, autorizar } from '../middlewares/auth.js';
import { uploadFoto } from '../middlewares/upload.js';

const router = Router();

router.use(autenticar);

// Admin e Eleitor podem consultar candidatos
router.get('/', autorizar(1, 2), listar);
router.get('/:id', autorizar(1, 2), buscarPorId);


// Apenas Admin gerencia candidatos
router.post('/', autorizar(1), uploadFoto, criar);
router.put('/:id', autorizar(1), uploadFoto, atualizar);
router.delete('/:id', autorizar(1), remover);

export default router;
