import { Router } from 'express';
import { listar, buscarPorId, votar, contarPorCandidato } from '../controllers/VotoController.js';
import { autenticar, autorizar } from '../middlewares/auth.js';

const router = Router();

router.use(autenticar);

// Apenas Admin consulta votos registrados
router.get('/', autorizar(1), listar);
router.get('/:id', autorizar(1), buscarPorId);
router.get('/candidato/:candidatoId/total', autorizar(1), contarPorCandidato);

// Admin e Eleitor podem votar
router.post('/', autorizar(1, 2), votar);

export default router;
