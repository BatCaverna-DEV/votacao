<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import api, { mensagemErro } from './services/api.js'
import { somFim } from './utils/som.js'
import TelaConfiguracao from './components/TelaConfiguracao.vue'
import UrnaEletronica from './components/UrnaEletronica.vue'
import BarraStatus from './components/BarraStatus.vue'

const CHAVE_URNA = 'urna_id'
// A sessão fica só nesta aba: outra aba ou dispositivo não consegue abrir a mesma urna
const CHAVE_SESSAO = 'urna_sessao'
// Consulta frequente para a urna abrir logo após o mesário liberar o eleitor
const INTERVALO_ATUALIZACAO = 2000

function lerUrnaSalva() {
  try { return localStorage.getItem(CHAVE_URNA) || '' } catch { return '' }
}

function salvarUrna(id) {
  try {
    if (id) localStorage.setItem(CHAVE_URNA, id)
    else localStorage.removeItem(CHAVE_URNA)
  } catch { /* sem armazenamento local, a urna funciona até recarregar a página */ }
}

function lerSessao() {
  try { return sessionStorage.getItem(CHAVE_SESSAO) || '' } catch { return '' }
}

function salvarSessao(valor) {
  try {
    if (valor) sessionStorage.setItem(CHAVE_SESSAO, valor)
    else sessionStorage.removeItem(CHAVE_SESSAO)
  } catch { /* sem armazenamento, a sessão vale até recarregar a página */ }
}

const urnaId = ref(lerUrnaSalva())
const sessao = ref(lerSessao())
const erroConexao = ref('')
const carregando = ref(!!urnaId.value)
const urna = ref(null)
const eleicao = ref(null)
const candidatos = ref([])

// 'aguardando' | 'encerrada' | 'bloqueada' | 'votacao' | 'enviando' | 'fim'
const etapa = ref('aguardando')
const eleitor = ref(null)
const mensagem = ref({ texto: '', tipo: 'info' })

let atualizador = null

function etapaPorStatus(status) {
  if (status === 1) return 'aguardando'
  if (status === 2) return 'bloqueada'
  return 'encerrada'
}

function avisar(texto, tipo = 'info') {
  mensagem.value = { texto, tipo }
}

function aplicarDados(dados) {
  sessao.value = dados.sessao
  salvarSessao(dados.sessao)
  urna.value = dados.urna
  eleicao.value = dados.eleicao
  candidatos.value = dados.candidatos

  // O voto está sendo enviado ou acabou de ser registrado
  if (['enviando', 'fim'].includes(etapa.value)) return

  const liberado = dados.eleicao.status === 2 ? dados.eleitor : null

  if (etapa.value === 'votacao') {
    // O mesário cancelou a liberação no sistema de gerenciamento
    if (liberado?.id !== eleitor.value?.id) {
      avisar(`Liberação de ${eleitor.value?.nome} cancelada pelo mesário.`, 'secondary')
      eleitor.value = null
      etapa.value = etapaPorStatus(dados.eleicao.status)
    }
    return
  }

  if (liberado) {
    eleitor.value = liberado
    etapa.value = 'votacao'
    avisar('')
    return
  }
  etapa.value = etapaPorStatus(dados.eleicao.status)
}

async function atualizar() {
  if (!urnaId.value) return
  try {
    const { data } = await api.post('/votacao/conectar', { urnas_id: urnaId.value, sessao: sessao.value })
    if (!atualizador) return // a urna foi desconectada enquanto a consulta estava em andamento
    aplicarDados(data.data)
    if (mensagem.value.tipo === 'warning') avisar('')
  } catch (err) {
    if ([404, 409].includes(err.response?.status)) {
      encerrarConexao(mensagemErro(err))
      return
    }
    avisar('Sem comunicação com o servidor. Tentando novamente...', 'warning')
  } finally {
    carregando.value = false
  }
}

function conectado(id, dados) {
  erroConexao.value = ''
  urnaId.value = id
  salvarUrna(id)
  etapa.value = 'aguardando'
  aplicarDados(dados)
  iniciarAtualizacao()
}

// Libera a urna no servidor para que possa ser aberta em outro dispositivo
function desconectar() {
  api.post('/votacao/desconectar', { urnas_id: urnaId.value, sessao: sessao.value }).catch(() => {})
  encerrarConexao('')
  salvarUrna('')
  urnaId.value = ''
}

// Volta para a tela de configuração (a urna não existe mais ou está aberta em outro lugar)
function encerrarConexao(motivo) {
  pararAtualizacao()
  salvarSessao('')
  sessao.value = ''
  erroConexao.value = motivo
  urna.value = null
  eleicao.value = null
  candidatos.value = []
  eleitor.value = null
  avisar('')
}

async function votar(voto) {
  etapa.value = 'enviando'
  try {
    await api.post('/votacao/votar', { urnas_id: urnaId.value, sessao: sessao.value, eleitores_id: eleitor.value.id, ...voto })
    somFim()
    etapa.value = 'fim'
    avisar(`Voto de ${eleitor.value.nome} registrado.`, 'success')
    setTimeout(() => {
      eleitor.value = null
      etapa.value = etapaPorStatus(eleicao.value?.status)
      atualizar()
    }, 3500)
  } catch (err) {
    if (!err.response) {
      // Falha de rede: o eleitor pode tentar confirmar de novo
      avisar('Sem comunicação com o servidor. Peça ao eleitor para confirmar novamente.', 'danger')
      etapa.value = 'votacao'
      return
    }
    if (err.response.status === 409) {
      encerrarConexao(mensagemErro(err))
      return
    }
    avisar(mensagemErro(err), 'danger')
    eleitor.value = null
    etapa.value = 'bloqueada'
    atualizar()
  }
}

function iniciarAtualizacao() {
  pararAtualizacao()
  atualizador = setInterval(atualizar, INTERVALO_ATUALIZACAO)
}

function pararAtualizacao() {
  if (atualizador) clearInterval(atualizador)
  atualizador = null
}

onMounted(() => {
  if (urnaId.value) {
    atualizar()
    iniciarAtualizacao()
  }
})

onBeforeUnmount(pararAtualizacao)
</script>

<template>
  <main class="pagina">
    <div v-if="carregando" class="text-center text-white">
      <div class="spinner-border mb-3"></div>
      <p>Conectando à urna...</p>
    </div>

    <TelaConfiguracao v-else-if="!urna" :id-inicial="urnaId" :erro-inicial="erroConexao" @conectado="conectado" />

    <template v-else>
      <UrnaEletronica
        :etapa="etapa"
        :eleicao="eleicao"
        :urna="urna"
        :candidatos="candidatos"
        @votar="votar"
      />
      <BarraStatus
        :etapa="etapa"
        :eleitor="eleitor"
        :mensagem="mensagem"
        @desconectar="desconectar"
      />
    </template>
  </main>
</template>

<style scoped>
.pagina {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 24px 16px;
}
</style>
