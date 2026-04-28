import { Usuario, Pessoa } from '../models/index.js';
import { gerarToken } from '../helpers/jwt.js';
import { success, badRequest, unauthorized } from '../helpers/response.js';
import { v4 as uuidv4 } from 'uuid';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return badRequest(res, 'Username e senha são obrigatórios');
    }

    const usuario = await Usuario.findOne({ where: { username } });

    if (!usuario || !(await usuario.verificarSenha(password))) {
      return unauthorized(res, 'Credenciais inválidas');
    }

    const token = gerarToken({
      id: usuario.id,
      username: usuario.username,
      categoria: usuario.categoria,
    });

    return success(res, { token, usuario: { id: usuario.id, username: usuario.username, categoria: usuario.categoria } }, 'Login realizado com sucesso');
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const registro = async (req, res) => {
  try {
    const { username, password, categoria, nome, matricula, email, curso } = req.body;

    if (!username || !password) {
      return badRequest(res, 'Username e senha são obrigatórios');
    }

    const existe = await Usuario.findOne({ where: { username } });
    if (existe) {
      return badRequest(res, 'Username já está em uso');
    }

    const usuario = await Usuario.create({ id: uuidv4(), username, password, categoria: categoria || 2 });

    const pessoa = await Pessoa.create({
      id: uuidv4(),
      nome,
      matricula,
      email,
      curso,
      usuarios_id: usuario.id,
    });

    const token = gerarToken({ id: usuario.id, username: usuario.username, categoria: usuario.categoria });

    return res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: { token, usuario: { id: usuario.id, username: usuario.username, categoria: usuario.categoria }, pessoa },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const perfil = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: { exclude: ['password'] },
      include: [{ association: 'pessoas' }],
    });

    return success(res, usuario);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
