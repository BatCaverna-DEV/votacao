import { Eleicao, Candidato, Urna, Eleitor } from '../models/index.js';
import { success, created, notFound, badRequest } from '../helpers/response.js';
import { STATUS } from '../helpers/eleicao.js';
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
    const { descricao, inicio, fim } = req.body;
    if (!descricao) return badRequest(res, 'Descrição é obrigatória');

    const eleicao = await Eleicao.create({ id: uuidv4(), descricao, status: STATUS.NAO_INICIADA, inicio, fim });
    return created(res, eleicao, 'Eleição criada com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const atualizar = async (req, res) => {
  try {
    const eleicao = await Eleicao.findByPk(req.params.id);
    if (!eleicao) return notFound(res, 'Eleição não encontrada');
    if (eleicao.status !== STATUS.NAO_INICIADA)
      return badRequest(res, 'A eleição só pode ser editada enquanto não foi iniciada');

    // O status só muda pelas rotas de iniciar/encerrar
    const { descricao, inicio, fim } = req.body;
    await eleicao.update({ descricao, inicio, fim });
    return success(res, eleicao, 'Eleição atualizada com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const remover = async (req, res) => {
  try {
    const eleicao = await Eleicao.findByPk(req.params.id);
    if (!eleicao) return notFound(res, 'Eleição não encontrada');
    if (eleicao.status === STATUS.EM_ANDAMENTO)
      return badRequest(res, 'Não é possível excluir uma eleição em andamento');

    await eleicao.destroy();
    return success(res, null, 'Eleição removida com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const iniciar = async (req, res) => {
  try {
    const eleicao = await Eleicao.findByPk(req.params.id);
    if (!eleicao) return notFound(res, 'Eleição não encontrada');
    if (eleicao.status !== STATUS.NAO_INICIADA)
      return badRequest(res, 'Apenas eleições não iniciadas podem ser iniciadas');

    const where = { eleicoes_id: eleicao.id };
    const [totalCandidatos, totalUrnas, totalEleitores] = await Promise.all([
      Candidato.count({ where }),
      Urna.count({ where }),
      Eleitor.count({ where }),
    ]);

    const pendencias = [];
    if (totalCandidatos === 0) pendencias.push('um candidato');
    if (totalUrnas === 0) pendencias.push('uma urna');
    if (totalEleitores === 0) pendencias.push('um eleitor');
    if (pendencias.length > 0)
      return badRequest(res, `Cadastre pelo menos ${pendencias.join(', ')} antes de iniciar a eleição`);

    await eleicao.update({ status: STATUS.EM_ANDAMENTO });
    return success(res, eleicao, 'Eleição iniciada');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const encerrar = async (req, res) => {
  try {
    const eleicao = await Eleicao.findByPk(req.params.id);
    if (!eleicao) return notFound(res, 'Eleição não encontrada');
    if (eleicao.status !== STATUS.EM_ANDAMENTO)
      return badRequest(res, 'Apenas eleições em andamento podem ser encerradas');

    await eleicao.update({ status: STATUS.ENCERRADA });

    // Eleitores que não votaram tornam-se "Faltou"
    await Eleitor.update(
      { status: 3 },
      { where: { eleicoes_id: eleicao.id, status: { [Op.in]: [0, 1] } } }
    );

    // Libera as urnas que ainda tinham eleitor aguardando
    await Urna.update({ eleitores_id: null }, { where: { eleicoes_id: eleicao.id } });

    return success(res, eleicao, 'Eleição encerrada');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
