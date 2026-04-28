export const success = (res, data, message = 'Sucesso', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

export const created = (res, data, message = 'Criado com sucesso') => {
  return success(res, data, message, 201);
};

export const error = (res, message = 'Erro interno', statusCode = 500, details = null) => {
  return res.status(statusCode).json({ success: false, message, ...(details && { details }) });
};

export const notFound = (res, message = 'Recurso não encontrado') => {
  return error(res, message, 404);
};

export const badRequest = (res, message = 'Requisição inválida', details = null) => {
  return error(res, message, 400, details);
};

export const unauthorized = (res, message = 'Não autorizado') => {
  return error(res, message, 401);
};

export const forbidden = (res, message = 'Acesso negado') => {
  return error(res, message, 403);
};
