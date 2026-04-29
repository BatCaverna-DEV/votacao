import { Router } from 'express';
import { minhasEleicoes } from '../controllers/VotacaoController.js';
import { autenticar, autorizar } from '../middlewares/auth.js';

const router = Router();

router.use(autenticar, autorizar(2));

router.get('/minhas-eleicoes', minhasEleicoes);

export default router;
