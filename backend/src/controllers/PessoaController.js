import { Pessoa, Usuario } from '../models/index.js';
import { success, created, notFound, badRequest } from '../helpers/response.js';
import { v4 as uuidv4 } from 'uuid';

export const listar = async (req, res) => {
  try {
    const pessoas = await Pessoa.findAll({ include: [{ association: 'usuario', attributes: { exclude: ['password'] } }] });
    return success(res, pessoas);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const buscarPorId = async (req, res) => {
  try {
    const pessoa = await Pessoa.findByPk(req.params.id, {
      include: [{ association: 'usuario', attributes: { exclude: ['password'] } }],
    });
    if (!pessoa) return notFound(res, 'Pessoa não encontrada');
    return success(res, pessoa);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const criar = async (req, res) => {
  try {
    const { nome, matricula, email, curso, usuarios_id } = req.body;

    if (!usuarios_id) return badRequest(res, 'usuarios_id é obrigatório');

    const usuario = await Usuario.findByPk(usuarios_id);
    if (!usuario) return notFound(res, 'Usuário não encontrado');

    const pessoa = await Pessoa.create({ id: uuidv4(), nome, matricula, email, curso, usuarios_id });
    return created(res, pessoa, 'Pessoa criada com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const atualizar = async (req, res) => {
  try {
    const pessoa = await Pessoa.findByPk(req.params.id);
    if (!pessoa) return notFound(res, 'Pessoa não encontrada');

    await pessoa.update(req.body);
    return success(res, pessoa, 'Pessoa atualizada com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const remover = async (req, res) => {
  try {
    const pessoa = await Pessoa.findByPk(req.params.id);
    if (!pessoa) return notFound(res, 'Pessoa não encontrada');

    await pessoa.destroy();
    return success(res, null, 'Pessoa removida com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
