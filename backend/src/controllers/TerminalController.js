import { Pessoa, Eleitor, Voto, Urna } from '../models/index.js';
import { success, notFound, badRequest, forbidden } from '../helpers/response.js';
import { v4 as uuidv4 } from 'uuid';

export const identificar = async (req, res) => {
  try {
    const { matricula, urnas_id } = req.body;
    if (!matricula) return badRequest(res, 'Matrícula é obrigatória');
    if (!urnas_id)  return badRequest(res, 'Urna não informada');

    const urna = await Urna.findByPk(urnas_id);
    if (!urna) return notFound(res, 'Urna não encontrada');
    if (urna.status !== 1) return forbidden(res, 'Esta urna não está disponível para votação');

    const pessoa = await Pessoa.findOne({ where: { matricula } });
    if (!pessoa) return notFound(res, 'Matrícula não encontrada');

    const eleitor = await Eleitor.findOne({
      where: { pessoas_id: pessoa.id, eleicoes_id: urna.eleicoes_id },
      include: [{ association: 'eleicao', include: [{ association: 'candidatos' }] }],
    });

    if (!eleitor) return forbidden(res, 'Você não está inscrito nesta eleição');
    if (eleitor.status === 2) return forbidden(res, 'Você já votou nesta eleição');
    if (eleitor.status === 0) return forbidden(res, 'Você não está liberado para votar');

    return success(res, {
      pessoa:  { nome: pessoa.nome, matricula: pessoa.matricula },
      eleitor: { id: eleitor.id },
      eleicao: {
        id: eleitor.eleicao.id,
        descricao: eleitor.eleicao.descricao,
        candidatos: eleitor.eleicao.candidatos,
        urna: { id: urna.id, descricao: urna.descricao },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const votar = async (req, res) => {
  try {
    const { eleitores_id, candidatos_id, urnas_id } = req.body;

    if (!eleitores_id || !candidatos_id || !urnas_id) {
      return badRequest(res, 'Dados incompletos para registrar o voto');
    }

    const eleitor = await Eleitor.findByPk(eleitores_id);
    if (!eleitor) return notFound(res, 'Eleitor não encontrado');
    if (eleitor.status === 2) return forbidden(res, 'Você já votou nesta eleição');
    if (eleitor.status === 0) return forbidden(res, 'Eleitor não está liberado');

    const urna = await Urna.findByPk(urnas_id);
    if (!urna || urna.status !== 1) return forbidden(res, 'Urna não está disponível para votação');

    await Voto.create({ id: uuidv4(), candidatos_id, urnas_id, status: 1 });
    await eleitor.update({ status: 2 });

    return success(res, null, 'Voto registrado com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
