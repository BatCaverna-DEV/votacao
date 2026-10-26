import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

// Mensagem amigável para exibir nas telas da urna
export function mensagemErro(err, padrao = 'Não foi possível comunicar com o servidor.') {
  return err.response?.data?.message || padrao
}

export default api
