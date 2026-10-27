import sequelize from '../config/database.js';
import { Urna, Candidato, Eleitor, Voto } from '../models/index.js';
import { success, created, notFound, forbidden, conflict } from '../helpers/response.js';
import { STATUS, STATUS_ELEITOR as ELEITOR } from '../helpers/eleicao.js';
import { resolverVoto, TIPO_VOTO } from '../helpers/voto.js';
import { sessaoAtiva } from '../helpers/urna.js';
import { v4 as uuidv4 } from 'uuid';

// Rotas usadas pela urna eletrônica. A urna se identifica pelo próprio ID,
// que o administrador copia da tela da eleição ao configurá-la.
// O eleitor é liberado pelo mesário no sistema de gerenciamento; a urna
// apenas consulta quem está liberado para votar nela.
// Cada urna só pode estar aberta em um dispositivo por vez: ao conectar, o
// dispositivo recebe uma sessão que deve acompanhar as demais requisições.

const URNA_EM_USO = 'Esta urna já está aberta em outro dispositivo';

async function carregarUrna(urnas_id) {
  if (!urnas_id) return { erro: 'Urna não informada' };
  const urna = await Urna.findByPk(urnas_id, {
    include: [
      { association: 'eleicao' },
      { association: 'eleitorLiberado', attributes: ['id'], include: [{ association: 'pessoa', attributes: ['nome', 'matricula'] }] },
    ],
  });
  if (!urna) return { erro: 'Urna não encontrada' };
  return { urna };
}

// Reserva a urna para o dispositivo e renova o sinal de vida da sessão
async function reservarSessao(urnas_id, sessao) {
  const t = await sequelize.transaction();
  try {
    const urna = await Urna.findByPk(urnas_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!urna) { await t.rollback(); return { erro: notFound, mensagem: 'Urna não encontrada' }; }

    const mesmaSessao = !!sessao && urna.sessao === sessao;
    if (!mesmaSessao && sessaoAtiva(urna)) { await t.rollback(); return { erro: conflict, mensagem: URNA_EM_USO }; }

    const novaSessao = mesmaSessao ? sessao : uuidv4();
    await urna.update({ sessao: novaSessao, ultimo_contato: new Date() }, { transaction: t });
    await t.commit();
    return { sessao: novaSessao };
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

export const conectar = async (req, res) => {
  try {
    if (!req.body.urnas_id) return notFound(res, 'Urna não informada');
    const reserva = await reservarSessao(req.body.urnas_id, req.body.sessao);
    if (reserva.erro) return reserva.erro(res, reserva.mensagem);

    const { urna, erro } = await carregarUrna(req.body.urnas_id);
    if (erro) return notFound(res, erro);

    const candidatos = await Candidato.findAll({
      where: { eleicoes_id: urna.eleicoes_id },
      attributes: ['id', 'numero', 'descricao', 'foto'],
      order: [['numero', 'ASC']],
    });

    return success(res, {
      sessao: reserva.sessao,
      urna: { id: urna.id, descricao: urna.descricao },
      eleicao: {
        id: urna.eleicao.id,
        descricao: urna.eleicao.descricao,
        status: urna.eleicao.status,
      },
      candidatos,
      eleitor: urna.eleitorLiberado
        ? { id: urna.eleitorLiberado.id, nome: urna.eleitorLiberado.pessoa?.nome, matricula: urna.eleitorLiberado.pessoa?.matricula }
        : null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const desconectar = async (req, res) => {
  try {
    const { urnas_id, sessao } = req.body;
    if (urnas_id && sessao) {
      await Urna.update({ sessao: null, ultimo_contato: null }, { where: { id: urnas_id, sessao } });
    }
    return success(res, null, 'Urna desconectada');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const votar = async (req, res) => {
  const { urnas_id, sessao, eleitores_id, numero, branco } = req.body;
  const t = await sequelize.transaction();
  try {
    const { urna, erro } = await carregarUrna(urnas_id);
    if (erro) { await t.rollback(); return notFound(res, erro); }
    if (!sessao || urna.sessao !== sessao) {
      await t.rollback();
      return conflict(res, URNA_EM_USO);
    }
    if (urna.eleicao.status !== STATUS.EM_ANDAMENTO) {
      await t.rollback();
      return forbidden(res, 'A eleição não está em andamento');
    }

    // Bloqueia o eleitor para impedir dois votos simultâneos
    const eleitor = await Eleitor.findByPk(eleitores_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!eleitor || eleitor.eleicoes_id !== urna.eleicoes_id) {
      await t.rollback();
      return forbidden(res, 'Eleitor não está inscrito nesta eleição');
    }
    if (urna.eleitores_id !== eleitor.id) {
      await t.rollback();
      return forbidden(res, 'Eleitor não foi liberado pelo mesário nesta urna');
    }
    if (eleitor.status !== ELEITOR.LIBERADO) {
      await t.rollback();
      return forbidden(res, eleitor.status === ELEITOR.VOTOU ? 'Este eleitor já votou' : 'Eleitor não foi liberado pelo mesário');
    }

    const candidatos = await Candidato.findAll({ where: { eleicoes_id: urna.eleicoes_id }, transaction: t });
    const { tipo, candidatos_id } = resolverVoto({ candidatos, numero, branco: branco === true });

    // O voto não guarda o eleitor, preservando o sigilo
    await Voto.create({ id: uuidv4(), urnas_id: urna.id, candidatos_id, tipo, status: 1 }, { transaction: t });
    await eleitor.update({ status: ELEITOR.VOTOU }, { transaction: t });
    await Urna.update({ eleitores_id: null }, { where: { id: urna.id }, transaction: t });
    await t.commit();

    const descricao = { [TIPO_VOTO.BRANCO]: 'branco', [TIPO_VOTO.NULO]: 'nulo', [TIPO_VOTO.NOMINAL]: 'nominal' }[tipo];
    return created(res, { tipo: descricao }, 'Voto registrado');
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ success: false, message: err.message });
  }
};
