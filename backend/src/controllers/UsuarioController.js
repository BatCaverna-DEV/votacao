import { Usuario } from '../models/index.js';
import { success, created, notFound, badRequest } from '../helpers/response.js';
import { v4 as uuidv4 } from 'uuid';

export const listar = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({ attributes: { exclude: ['password'] } });
    return success(res, usuarios);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const buscarPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });
    if (!usuario) return notFound(res, 'Usuário não encontrado');
    return success(res, usuario);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const criar = async (req, res) => {
  try {
    const { username, password, categoria } = req.body;

    if (!username || !password) return badRequest(res, 'Username e senha são obrigatórios');

    const existe = await Usuario.findOne({ where: { username } });
    if (existe) return badRequest(res, 'Username já está em uso');

    const usuario = await Usuario.create({ id: uuidv4(), username, password, categoria });
    const { password: _, ...dados } = usuario.toJSON();
    return created(res, dados, 'Usuário criado com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const atualizar = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return notFound(res, 'Usuário não encontrado');

    await usuario.update(req.body);
    const { password: _, ...dados } = usuario.toJSON();
    return success(res, dados, 'Usuário atualizado com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const remover = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return notFound(res, 'Usuário não encontrado');

    await usuario.destroy();
    return success(res, null, 'Usuário removido com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
