import { Router } from 'express';
import { login, perfil } from '../controllers/AuthController.js';
import { autenticar } from '../middlewares/auth.js';

const router = Router();

router.post('/login', login);
router.get('/perfil', autenticar, perfil);

export default router;
