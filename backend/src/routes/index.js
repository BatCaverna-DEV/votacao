import { Router } from 'express';
import authRoutes from './auth.js';
import usuariosRoutes from './usuarios.js';
import pessoasRoutes from './pessoas.js';
import eleicoesRoutes from './eleicoes.js';
import candidatosRoutes from './candidatos.js';
import eleitoresRoutes from './eleitores.js';
import urnasRoutes from './urnas.js';
import votosRoutes from './votos.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'API Sistema de Votação v1.0' });
});

router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/pessoas', pessoasRoutes);
router.use('/eleicoes', eleicoesRoutes);
router.use('/candidatos', candidatosRoutes);
router.use('/eleitores', eleitoresRoutes);
router.use('/urnas', urnasRoutes);
router.use('/votos', votosRoutes);

export default router;
