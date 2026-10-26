import { Usuario } from '../models/index.js';
import { gerarToken } from '../helpers/jwt.js';
import { success, badRequest, unauthorized } from '../helpers/response.js';

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

    if (usuario.categoria !== 1) {
      return unauthorized(res, 'Acesso restrito a administradores');
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
