// A urna aberta em um dispositivo envia sinal de vida a cada poucos segundos.
// Sem contato por este tempo, a sessão expira e a urna pode ser aberta em outro lugar.
export const SESSAO_EXPIRA_MS = 15000;

export const sessaoAtiva = (urna) =>
  !!urna.sessao && !!urna.ultimo_contato && Date.now() - new Date(urna.ultimo_contato).getTime() < SESSAO_EXPIRA_MS;
