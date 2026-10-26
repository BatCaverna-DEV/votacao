// Brancos e nulos são tipos de voto, não candidatos: nenhuma eleição precisa
// cadastrar um "candidato branco" ou "candidato nulo".
export const TIPO_VOTO = { NOMINAL: 1, BRANCO: 2, NULO: 3 };

// Nomes que não podem ser usados por candidatos, pois esses votos já são automáticos
const NOMES_RESERVADOS = ['branco', 'nulo', 'voto branco', 'voto nulo', 'voto em branco', 'em branco'];

const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export const nomeReservado = (descricao) => NOMES_RESERVADOS.includes(normalizar(descricao));

// Converte o que o eleitor digitou na urna no voto a ser registrado:
// - branco: true            → voto em branco (tecla BRANCO)
// - número de um candidato  → voto nominal
// - qualquer outro número   → voto nulo
export const resolverVoto = ({ candidatos, numero, branco = false }) => {
  if (branco) return { tipo: TIPO_VOTO.BRANCO, candidatos_id: null };

  const digitado = Number(numero);
  const candidato = Number.isInteger(digitado)
    ? candidatos.find((c) => c.numero === digitado)
    : null;

  if (candidato) return { tipo: TIPO_VOTO.NOMINAL, candidatos_id: candidato.id };
  return { tipo: TIPO_VOTO.NULO, candidatos_id: null };
};
