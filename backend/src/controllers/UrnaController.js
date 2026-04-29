import { Urna, Eleicao, Voto } from '../models/index.js';
import { Op } from 'sequelize';
import { success, created, notFound, badRequest } from '../helpers/response.js';
import { v4 as uuidv4 } from 'uuid';

export const listar = async (req, res) => {
  try {
    const where = req.query.eleicao ? { eleicoes_id: req.query.eleicao } : {};
    const urnas = await Urna.findAll({ where, include: [{ association: 'eleicao' }] });
    return success(res, urnas);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const buscarPorId = async (req, res) => {
  try {
    const urna = await Urna.findByPk(req.params.id, {
      include: [{ association: 'eleicao' }],
    });
    if (!urna) return notFound(res, 'Urna não encontrada');
    return success(res, urna);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const criar = async (req, res) => {
  try {
    const { descricao, eleicoes_id } = req.body;

    if (!eleicoes_id) return badRequest(res, 'eleicoes_id é obrigatório');

    const eleicao = await Eleicao.findByPk(eleicoes_id);
    if (!eleicao) return notFound(res, 'Eleição não encontrada');

    const urna = await Urna.create({ id: uuidv4(), descricao, status: 1, eleicoes_id });
    return created(res, urna, 'Urna criada com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const atualizar = async (req, res) => {
  try {
    const urna = await Urna.findByPk(req.params.id);
    if (!urna) return notFound(res, 'Urna não encontrada');

    await urna.update(req.body);
    return success(res, urna, 'Urna atualizada com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const remover = async (req, res) => {
  try {
    const urna = await Urna.findByPk(req.params.id);
    if (!urna) return notFound(res, 'Urna não encontrada');

    await urna.destroy();
    return success(res, null, 'Urna removida com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const votosUrna = async (req, res) => {
  try {
    const urna = await Urna.findByPk(req.params.id);
    if (!urna) return notFound(res, 'Urna não encontrada');

    const votos = await Voto.findAll({
      where: { urnas_id: req.params.id },
      include: [{ association: 'candidato' }],
    });

    return success(res, { urna, votos, totalVotos: votos.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const apurar = async (req, res) => {
  try {
    const urna = await Urna.findByPk(req.params.id);
    if (!urna) return notFound(res, 'Urna não encontrada');
    if (urna.status === 3) return badRequest(res, 'Urna já foi apurada');

    await Voto.update({ status: 2 }, { where: { urnas_id: urna.id, status: 1 } });
    await urna.update({ status: 3 });
    return success(res, urna, 'Urna apurada com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
