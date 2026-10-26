import { Eleitor, Pessoa } from '../models/index.js';
import { success, created, notFound, badRequest } from '../helpers/response.js';
import { validarEleicaoEditavel } from '../helpers/eleicao.js';
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

    const pessoa = await Pessoa.findByPk(pessoas_id);
    if (!pessoa) return notFound(res, 'Pessoa não encontrada');

    const erro = await validarEleicaoEditavel(eleicoes_id);
    if (erro) return badRequest(res, erro);

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

    const erro = await validarEleicaoEditavel(eleitor.eleicoes_id);
    if (erro) return badRequest(res, erro);

    // O status do eleitor é controlado pelo sistema da urna
    const { pessoas_id = eleitor.pessoas_id } = req.body;
    const pessoa = await Pessoa.findByPk(pessoas_id);
    if (!pessoa) return notFound(res, 'Pessoa não encontrada');

    const jaInscrito = await Eleitor.findOne({ where: { pessoas_id, eleicoes_id: eleitor.eleicoes_id } });
    if (jaInscrito && jaInscrito.id !== eleitor.id) return badRequest(res, 'Pessoa já inscrita nesta eleição');

    await eleitor.update({ pessoas_id });
    return success(res, eleitor, 'Eleitor atualizado com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const remover = async (req, res) => {
  try {
    const eleitor = await Eleitor.findByPk(req.params.id);
    if (!eleitor) return notFound(res, 'Eleitor não encontrado');

    const erro = await validarEleicaoEditavel(eleitor.eleicoes_id);
    if (erro) return badRequest(res, erro);

    await eleitor.destroy();
    return success(res, null, 'Eleitor removido com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
