import { Candidato, Eleicao } from '../models/index.js';
import { success, created, notFound, badRequest } from '../helpers/response.js';
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

    if (!eleicoes_id) return badRequest(res, 'eleicoes_id é obrigatório');

    const eleicao = await Eleicao.findByPk(eleicoes_id);
    if (!eleicao) return notFound(res, 'Eleição não encontrada');

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
    if (!candidato) return notFound(res, 'Candidato não encontrado');

    const updates = { ...req.body };

    if (req.file) {
      deletarFoto(candidato.foto);
      updates.foto = `/uploads/candidatos/${req.file.filename}`;
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

    deletarFoto(candidato.foto);
    await candidato.destroy();
    return success(res, null, 'Candidato removido com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
