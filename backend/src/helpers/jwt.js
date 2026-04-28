import jwt from 'jsonwebtoken';

export const gerarToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
};

export const verificarToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const decodificarToken = (token) => {
  return jwt.decode(token);
};
