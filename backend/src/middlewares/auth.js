import { verificarToken } from '../helpers/jwt.js';
import { unauthorized, forbidden } from '../helpers/response.js';

export const autenticar = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'Token de autenticação não fornecido');
  }

  const token = authHeader.split(' ')[1];

  try {
    req.usuario = verificarToken(token);
    next();
  } catch {
    return unauthorized(res, 'Token inválido ou expirado');
  }
};

export const autorizar = (...categorias) => {
  return (req, res, next) => {
    if (!categorias.includes(req.usuario?.categoria)) {
      return forbidden(res, 'Você não tem permissão para acessar este recurso');
    }
    next();
  };
};
