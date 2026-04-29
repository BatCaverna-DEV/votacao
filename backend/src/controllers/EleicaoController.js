import { Eleicao, Candidato, Urna, Eleitor } from '../models/index.js';
import { success, created, notFound, badRequest } from '../helpers/response.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

export const listar = async (req, res) => {
  try {
    const eleicoes = await Eleicao.findAll();
    return success(res, eleicoes);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const buscarPorId = async (req, res) => {
  try {
    const eleicao = await Eleicao.findByPk(req.params.id, {
      include: [
        { association: 'candidatos' },
        { association: 'urnas' },
      ],
    });
    if (!eleicao) return notFound(res, 'Eleição não encontrada');
    return success(res, eleicao);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const criar = async (req, res) => {
  try {
    const { descricao, status, inicio, fim } = req.body;
    if (!descricao) return badRequest(res, 'Descrição é obrigatória');

    const eleicao = await Eleicao.create({ id: uuidv4(), descricao, status: status ?? 1, inicio, fim });
    return created(res, eleicao, 'Eleição criada com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const atualizar = async (req, res) => {
  try {
    const eleicao = await Eleicao.findByPk(req.params.id);
    if (!eleicao) return notFound(res, 'Eleição não encontrada');

    if (req.body.status === 4) {
      const urnasPendentes = await Urna.count({
        where: { eleicoes_id: eleicao.id, status: { [Op.ne]: 3 } },
      });
      if (urnasPendentes > 0)
        return badRequest(res, 'Todas as urnas precisam ser apuradas antes de finalizar a eleição');
    }

    await eleicao.update(req.body);

    // Ao encerrar a votação (Em Apuração), eleitores que não votaram tornam-se "Faltou"
    if (req.body.status === 3) {
      await Eleitor.update(
        { status: 3 },
        { where: { eleicoes_id: eleicao.id, status: { [Op.in]: [0, 1] } } }
      );
    }

    return success(res, eleicao, 'Eleição atualizada com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const remover = async (req, res) => {
  try {
    const eleicao = await Eleicao.findByPk(req.params.id);
    if (!eleicao) return notFound(res, 'Eleição não encontrada');

    await eleicao.destroy();
    return success(res, null, 'Eleição removida com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const resultado = async (req, res) => {
  try {
    const eleicao = await Eleicao.findByPk(req.params.id);
    if (!eleicao) return notFound(res, 'Eleição não encontrada');

    const candidatos = await Candidato.findAll({
      where: { eleicoes_id: req.params.id },
      include: [{ association: 'votos', where: { status: 2 }, required: false }],
    });

    const totalEleitores = await Eleitor.count({ where: { eleicoes_id: req.params.id } });
    const totalVotos = candidatos.reduce((acc, c) => acc + c.votos.length, 0);

    return success(res, { eleicao, candidatos, totalEleitores, totalVotos });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
