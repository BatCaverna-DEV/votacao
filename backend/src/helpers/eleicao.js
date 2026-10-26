import { Eleicao } from '../models/index.js';

// 1=Não iniciada, 2=Em andamento, 3=Encerrada (4 é legado e equivale a Encerrada)
export const STATUS = { NAO_INICIADA: 1, EM_ANDAMENTO: 2, ENCERRADA: 3 };

// Retorna uma mensagem de erro se a eleição não puder mais ter seus dados alterados
export const validarEleicaoEditavel = async (eleicoes_id) => {
  const eleicao = await Eleicao.findByPk(eleicoes_id);
  if (!eleicao) return 'Eleição não encontrada';
  if (eleicao.status !== STATUS.NAO_INICIADA) {
    return 'Os dados só podem ser alterados enquanto a eleição não foi iniciada';
  }
  return null;
};
