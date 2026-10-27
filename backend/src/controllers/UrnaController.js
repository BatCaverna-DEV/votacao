import sequelize from '../config/database.js';
import { Urna, Eleitor, Pessoa } from '../models/index.js';
import { success, created, notFound, badRequest, forbidden } from '../helpers/response.js';
import { validarEleicaoEditavel, STATUS, STATUS_ELEITOR } from '../helpers/eleicao.js';
import { sessaoAtiva } from '../helpers/urna.js';
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

    const erro = await validarEleicaoEditavel(eleicoes_id);
    if (erro) return badRequest(res, erro);

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

    const { descricao, eleicoes_id = urna.eleicoes_id } = req.body;
    for (const id of new Set([urna.eleicoes_id, eleicoes_id])) {
      const erro = await validarEleicaoEditavel(id);
      if (erro) return badRequest(res, erro);
    }

    await urna.update({ descricao, eleicoes_id });
    return success(res, urna, 'Urna atualizada com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const remover = async (req, res) => {
  try {
    const urna = await Urna.findByPk(req.params.id);
    if (!urna) return notFound(res, 'Urna não encontrada');

    const erro = await validarEleicaoEditavel(urna.eleicoes_id);
    if (erro) return badRequest(res, erro);

    await urna.destroy();
    return success(res, null, 'Urna removida com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// --- Painel do mesário: libera o eleitor para votar em uma urna ---

const incluirEleitorLiberado = {
  association: 'eleitorLiberado',
  attributes: ['id', 'status'],
  include: [{ association: 'pessoa', attributes: ['nome', 'matricula'] }],
};

function dadosPainel(urna) {
  const eleitor = urna.eleitorLiberado;
  return {
    urna: { id: urna.id, descricao: urna.descricao, conectada: sessaoAtiva(urna) },
    eleicao: { id: urna.eleicao.id, descricao: urna.eleicao.descricao, status: urna.eleicao.status },
    eleitor: eleitor ? { id: eleitor.id, nome: eleitor.pessoa?.nome, matricula: eleitor.pessoa?.matricula } : null,
  };
}

export const painel = async (req, res) => {
  try {
    const urna = await Urna.findByPk(req.params.id, {
      include: [{ association: 'eleicao' }, incluirEleitorLiberado],
    });
    if (!urna) return notFound(res, 'Urna não encontrada');
    return success(res, dadosPainel(urna));
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const liberar = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const urna = await Urna.findByPk(req.params.id, {
      include: [{ association: 'eleicao' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!urna) { await t.rollback(); return notFound(res, 'Urna não encontrada'); }
    if (urna.eleicao.status !== STATUS.EM_ANDAMENTO) {
      await t.rollback();
      return forbidden(res, 'A eleição não está em andamento');
    }
    if (urna.eleitores_id) {
      await t.rollback();
      return badRequest(res, 'A urna já está liberada para outro eleitor');
    }

    const matricula = String(req.body.matricula ?? '').trim();
    if (!matricula) { await t.rollback(); return badRequest(res, 'Informe a matrícula do eleitor'); }

    const pessoa = await Pessoa.findOne({ where: { matricula }, transaction: t });
    if (!pessoa) { await t.rollback(); return notFound(res, 'Matrícula não encontrada'); }

    const eleitor = await Eleitor.findOne({
      where: { pessoas_id: pessoa.id, eleicoes_id: urna.eleicoes_id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!eleitor) { await t.rollback(); return forbidden(res, 'Eleitor não está inscrito nesta eleição'); }
    if (eleitor.status === STATUS_ELEITOR.VOTOU) { await t.rollback(); return forbidden(res, 'Este eleitor já votou'); }
    if (eleitor.status === STATUS_ELEITOR.LIBERADO) {
      await t.rollback();
      return forbidden(res, 'Este eleitor já está liberado em outra urna');
    }
    if (eleitor.status !== STATUS_ELEITOR.PENDENTE) {
      await t.rollback();
      return forbidden(res, 'Este eleitor não pode mais votar');
    }

    await eleitor.update({ status: STATUS_ELEITOR.LIBERADO }, { transaction: t });
    await urna.update({ eleitores_id: eleitor.id }, { transaction: t });
    await t.commit();

    return success(res, {
      eleitor: { id: eleitor.id, nome: pessoa.nome, matricula: pessoa.matricula },
    }, 'Eleitor liberado para votar');
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const cancelarLiberacao = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const urna = await Urna.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!urna) { await t.rollback(); return notFound(res, 'Urna não encontrada'); }
    if (!urna.eleitores_id) { await t.rollback(); return badRequest(res, 'Nenhum eleitor está liberado nesta urna'); }

    // O eleitor volta a ficar pendente e pode ser liberado novamente
    await Eleitor.update(
      { status: STATUS_ELEITOR.PENDENTE },
      { where: { id: urna.eleitores_id, status: STATUS_ELEITOR.LIBERADO }, transaction: t }
    );
    await urna.update({ eleitores_id: null }, { transaction: t });
    await t.commit();

    return success(res, null, 'Liberação cancelada');
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ success: false, message: err.message });
  }
};
