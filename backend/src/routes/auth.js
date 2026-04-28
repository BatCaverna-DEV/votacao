import { Router } from 'express';
import { login, registro, perfil } from '../controllers/AuthController.js';
import { autenticar } from '../middlewares/auth.js';

const router = Router();

router.post('/login', login);
router.post('/registro', registro);
router.get('/perfil', autenticar, perfil);

export default router;
