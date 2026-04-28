import { Voto, Candidato, Urna, Eleitor, Eleicao } from '../models/index.js';
import { success, created, notFound, badRequest, forbidden } from '../helpers/response.js';
import { v4 as uuidv4 } from 'uuid';

export const listar = async (req, res) => {
  try {
    const votos = await Voto.findAll({
      include: [
        { association: 'candidato', include: [{ association: 'eleicao' }] },
        { association: 'urna' },
      ],
    });
    return success(res, votos);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const buscarPorId = async (req, res) => {
  try {
    const voto = await Voto.findByPk(req.params.id, {
      include: [{ association: 'candidato' }, { association: 'urna' }],
    });
    if (!voto) return notFound(res, 'Voto não encontrado');
    return success(res, voto);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const votar = async (req, res) => {
  try {
    const { candidatos_id, urnas_id, eleitores_id } = req.body;

    if (!candidatos_id || !urnas_id || !eleitores_id) {
      return badRequest(res, 'candidatos_id, urnas_id e eleitores_id são obrigatórios');
    }

    const [candidato, urna, eleitor] = await Promise.all([
      Candidato.findByPk(candidatos_id),
      Urna.findByPk(urnas_id),
      Eleitor.findByPk(eleitores_id),
    ]);

    if (!candidato) return notFound(res, 'Candidato não encontrado');
    if (!urna) return notFound(res, 'Urna não encontrada');
    if (!eleitor) return notFound(res, 'Eleitor não encontrado');

    if (urna.status !== 1) return forbidden(res, 'Urna não está ativa');
    if (eleitor.status === 1) return forbidden(res, 'Eleitor já votou nesta eleição');

    if (candidato.eleicoes_id !== urna.eleicoes_id) {
      return badRequest(res, 'Candidato e urna pertencem a eleições diferentes');
    }

    const voto = await Voto.create({ id: uuidv4(), candidatos_id, urnas_id });
    await eleitor.update({ status: 1 });

    return created(res, { voto }, 'Voto registrado com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const contarPorCandidato = async (req, res) => {
  try {
    const candidato = await Candidato.findByPk(req.params.candidatoId);
    if (!candidato) return notFound(res, 'Candidato não encontrado');

    const total = await Voto.count({ where: { candidatos_id: req.params.candidatoId } });
    return success(res, { candidato, total });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
