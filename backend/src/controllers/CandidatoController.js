import { Candidato } from '../models/index.js';
import { success, created, notFound, badRequest } from '../helpers/response.js';
import { validarEleicaoEditavel } from '../helpers/eleicao.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function deletarFoto(foto) {
  if (!foto) return;
  const arquivo = path.join(__dirname, '../../uploads/candidatos', path.basename(foto));
  fs.unlink(arquivo, () => {});
}

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

    if (!eleicoes_id) {
      if (req.file) deletarFoto(req.file.filename);
      return badRequest(res, 'eleicoes_id é obrigatório');
    }

    const erro = await validarEleicaoEditavel(eleicoes_id);
    if (erro) {
      if (req.file) deletarFoto(req.file.filename);
      return badRequest(res, erro);
    }

    const foto = req.file ? `/uploads/candidatos/${req.file.filename}` : null;

    const candidato = await Candidato.create({ id: uuidv4(), descricao, numero, eleicoes_id, foto });
    return created(res, candidato, 'Candidato criado com sucesso');
  } catch (err) {
    if (req.file) deletarFoto(req.file.filename);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const atualizar = async (req, res) => {
  try {
    const candidato = await Candidato.findByPk(req.params.id);
    if (!candidato) {
      if (req.file) deletarFoto(req.file.filename);
      return notFound(res, 'Candidato não encontrado');
    }

    const { descricao, numero, eleicoes_id = candidato.eleicoes_id } = req.body;
    for (const id of new Set([candidato.eleicoes_id, eleicoes_id])) {
      const erro = await validarEleicaoEditavel(id);
      if (erro) {
        if (req.file) deletarFoto(req.file.filename);
        return badRequest(res, erro);
      }
    }

    const updates = { descricao, numero, eleicoes_id };

    if (req.file) {
      deletarFoto(candidato.foto);
      updates.foto = `/uploads/candidatos/${req.file.filename}`;
    } else if (req.body.removerFoto === '1') {
      deletarFoto(candidato.foto);
      updates.foto = null;
    }

    await candidato.update(updates);
    return success(res, candidato, 'Candidato atualizado com sucesso');
  } catch (err) {
    if (req.file) deletarFoto(req.file.filename);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const remover = async (req, res) => {
  try {
    const candidato = await Candidato.findByPk(req.params.id);
    if (!candidato) return notFound(res, 'Candidato não encontrado');

    const erro = await validarEleicaoEditavel(candidato.eleicoes_id);
    if (erro) return badRequest(res, erro);

    deletarFoto(candidato.foto);
    await candidato.destroy();
    return success(res, null, 'Candidato removido com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
