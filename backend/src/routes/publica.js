import { Router } from 'express';
import { Eleicao, Candidato, Eleitor, Urna } from '../models/index.js';
import { success, notFound } from '../helpers/response.js';
import { Op } from 'sequelize';

const router = Router();

// Lista todas as eleições (sem dados sensíveis)
router.get('/eleicoes', async (req, res) => {
  try {
    const eleicoes = await Eleicao.findAll({
      order: [['inicio', 'DESC']],
    });
    return success(res, eleicoes);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Detalhe público de uma eleição com resultado parcial/final
router.get('/eleicoes/:id', async (req, res) => {
  try {
    const eleicao = await Eleicao.findByPk(req.params.id);
    if (!eleicao) return notFound(res, 'Eleição não encontrada');

    const candidatos = await Candidato.findAll({
      where: { eleicoes_id: req.params.id },
      // votos só aparecem quando status >= 3 (Em Apuração / Finalizada)
      include: eleicao.status >= 3
        ? [{ association: 'votos', where: { status: 2 }, required: false }]
        : [],
    });

    const totalEleitores = await Eleitor.count({ where: { eleicoes_id: req.params.id } });
    const totalVotos = eleicao.status >= 3
      ? candidatos.reduce((acc, c) => acc + (c.votos?.length ?? 0), 0)
      : 0;

    const urnas = await Urna.findAll({ where: { eleicoes_id: req.params.id } });
    const todasApuradas = urnas.length > 0 && urnas.every(u => u.status === 3);

    return success(res, { eleicao, candidatos, totalEleitores, totalVotos, todasApuradas });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
