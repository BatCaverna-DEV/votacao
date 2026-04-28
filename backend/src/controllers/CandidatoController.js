import { Candidato, Eleicao } from '../models/index.js';
import { success, created, notFound, badRequest } from '../helpers/response.js';
import { v4 as uuidv4 } from 'uuid';

export const listar = async (req, res) => {
  try {
    const where = req.query.eleicao ? { eleicoes_id: req.query.eleicao } : {};
    const candidatos = await Candidato.findAll({ where, include: [{ association: 'eleicao' }] });
    return success(res, candidatos);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const buscarPorId = async (req, res) => {
  try {
    const candidato = await Candidato.findByPk(req.params.id, {
      include: [{ association: 'eleicao' }],
    });
    if (!candidato) return notFound(res, 'Candidato não encontrado');
    return success(res, candidato);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const criar = async (req, res) => {
  try {
    const { descricao, numero, eleicoes_id } = req.body;

    if (!eleicoes_id) return badRequest(res, 'eleicoes_id é obrigatório');

    const eleicao = await Eleicao.findByPk(eleicoes_id);
    if (!eleicao) return notFound(res, 'Eleição não encontrada');

    const candidato = await Candidato.create({ id: uuidv4(), descricao, numero, eleicoes_id });
    return created(res, candidato, 'Candidato criado com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const atualizar = async (req, res) => {
  try {
    const candidato = await Candidato.findByPk(req.params.id);
    if (!candidato) return notFound(res, 'Candidato não encontrado');

    await candidato.update(req.body);
    return success(res, candidato, 'Candidato atualizado com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const remover = async (req, res) => {
  try {
    const candidato = await Candidato.findByPk(req.params.id);
    if (!candidato) return notFound(res, 'Candidato não encontrado');

    await candidato.destroy();
    return success(res, null, 'Candidato removido com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
