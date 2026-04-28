import { Eleitor, Pessoa, Eleicao } from '../models/index.js';
import { success, created, notFound, badRequest } from '../helpers/response.js';
import { v4 as uuidv4 } from 'uuid';

export const listar = async (req, res) => {
  try {
    const where = req.query.eleicao ? { eleicoes_id: req.query.eleicao } : {};
    const eleitores = await Eleitor.findAll({
      where,
      include: [{ association: 'pessoa' }, { association: 'eleicao' }],
    });
    return success(res, eleitores);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const buscarPorId = async (req, res) => {
  try {
    const eleitor = await Eleitor.findByPk(req.params.id, {
      include: [{ association: 'pessoa' }, { association: 'eleicao' }],
    });
    if (!eleitor) return notFound(res, 'Eleitor não encontrado');
    return success(res, eleitor);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const criar = async (req, res) => {
  try {
    const { pessoas_id, eleicoes_id } = req.body;

    if (!pessoas_id || !eleicoes_id) return badRequest(res, 'pessoas_id e eleicoes_id são obrigatórios');

    const [pessoa, eleicao] = await Promise.all([
      Pessoa.findByPk(pessoas_id),
      Eleicao.findByPk(eleicoes_id),
    ]);

    if (!pessoa) return notFound(res, 'Pessoa não encontrada');
    if (!eleicao) return notFound(res, 'Eleição não encontrada');

    const jaInscrito = await Eleitor.findOne({ where: { pessoas_id, eleicoes_id } });
    if (jaInscrito) return badRequest(res, 'Pessoa já inscrita nesta eleição');

    const eleitor = await Eleitor.create({ id: uuidv4(), status: 0, pessoas_id, eleicoes_id });
    return created(res, eleitor, 'Eleitor inscrito com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const atualizar = async (req, res) => {
  try {
    const eleitor = await Eleitor.findByPk(req.params.id);
    if (!eleitor) return notFound(res, 'Eleitor não encontrado');

    await eleitor.update(req.body);
    return success(res, eleitor, 'Eleitor atualizado com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const remover = async (req, res) => {
  try {
    const eleitor = await Eleitor.findByPk(req.params.id);
    if (!eleitor) return notFound(res, 'Eleitor não encontrado');

    await eleitor.destroy();
    return success(res, null, 'Eleitor removido com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
