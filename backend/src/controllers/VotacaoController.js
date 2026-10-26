import sequelize from '../config/database.js';
import { Urna, Eleicao, Candidato, Eleitor, Pessoa, Voto } from '../models/index.js';
import { success, created, notFound, badRequest, forbidden } from '../helpers/response.js';
import { STATUS } from '../helpers/eleicao.js';
import { resolverVoto, TIPO_VOTO } from '../helpers/voto.js';
import { v4 as uuidv4 } from 'uuid';

// Rotas usadas pela urna eletrônica. A urna se identifica pelo próprio ID,
// que o administrador copia da tela da eleição ao configurá-la.

// Status do eleitor: 0=Pendente, 1=Liberado, 2=Votou, 3=Faltou
const ELEITOR = { PENDENTE: 0, LIBERADO: 1, VOTOU: 2 };

async function carregarUrna(urnas_id) {
  if (!urnas_id) return { erro: 'Urna não informada' };
  const urna = await Urna.findByPk(urnas_id, { include: [{ association: 'eleicao' }] });
  if (!urna) return { erro: 'Urna não encontrada' };
  return { urna };
}

export const conectar = async (req, res) => {
  try {
    const { urna, erro } = await carregarUrna(req.body.urnas_id);
    if (erro) return notFound(res, erro);

    const candidatos = await Candidato.findAll({
      where: { eleicoes_id: urna.eleicoes_id },
      attributes: ['id', 'numero', 'descricao', 'foto'],
      order: [['numero', 'ASC']],
    });

    return success(res, {
      urna: { id: urna.id, descricao: urna.descricao },
      eleicao: {
        id: urna.eleicao.id,
        descricao: urna.eleicao.descricao,
        status: urna.eleicao.status,
      },
      candidatos,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const identificar = async (req, res) => {
  try {
    const { urna, erro } = await carregarUrna(req.body.urnas_id);
    if (erro) return notFound(res, erro);
    if (urna.eleicao.status !== STATUS.EM_ANDAMENTO) return forbidden(res, 'A eleição não está em andamento');

    const matricula = String(req.body.matricula ?? '').trim();
    if (!matricula) return badRequest(res, 'Informe a matrícula do eleitor');

    const pessoa = await Pessoa.findOne({ where: { matricula } });
    if (!pessoa) return notFound(res, 'Matrícula não encontrada');

    const eleitor = await Eleitor.findOne({ where: { pessoas_id: pessoa.id, eleicoes_id: urna.eleicoes_id } });
    if (!eleitor) return forbidden(res, 'Eleitor não está inscrito nesta eleição');
    if (eleitor.status === ELEITOR.VOTOU) return forbidden(res, 'Este eleitor já votou');
    if (![ELEITOR.PENDENTE, ELEITOR.LIBERADO].includes(eleitor.status)) {
      return forbidden(res, 'Este eleitor não pode mais votar');
    }

    await eleitor.update({ status: ELEITOR.LIBERADO });

    return success(res, {
      eleitor: { id: eleitor.id, nome: pessoa.nome, matricula: pessoa.matricula },
    }, 'Eleitor liberado para votar');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const votar = async (req, res) => {
  const { urnas_id, eleitores_id, numero, branco } = req.body;
  const t = await sequelize.transaction();
  try {
    const { urna, erro } = await carregarUrna(urnas_id);
    if (erro) { await t.rollback(); return notFound(res, erro); }
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
    if (eleitor.status !== ELEITOR.LIBERADO) {
      await t.rollback();
      return forbidden(res, eleitor.status === ELEITOR.VOTOU ? 'Este eleitor já votou' : 'Eleitor não foi liberado pelo mesário');
    }

    const candidatos = await Candidato.findAll({ where: { eleicoes_id: urna.eleicoes_id }, transaction: t });
    const { tipo, candidatos_id } = resolverVoto({ candidatos, numero, branco: branco === true });

    // O voto não guarda o eleitor, preservando o sigilo
    await Voto.create({ id: uuidv4(), urnas_id: urna.id, candidatos_id, tipo, status: 1 }, { transaction: t });
    await eleitor.update({ status: ELEITOR.VOTOU }, { transaction: t });
    await t.commit();

    const descricao = { [TIPO_VOTO.BRANCO]: 'branco', [TIPO_VOTO.NULO]: 'nulo', [TIPO_VOTO.NOMINAL]: 'nominal' }[tipo];
    return created(res, { tipo: descricao }, 'Voto registrado');
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ success: false, message: err.message });
  }
};
