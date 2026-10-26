<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import api, { mensagemErro } from './services/api.js'
import { somFim } from './utils/som.js'
import TelaConfiguracao from './components/TelaConfiguracao.vue'
import UrnaEletronica from './components/UrnaEletronica.vue'
import TerminalMesario from './components/TerminalMesario.vue'

const CHAVE_URNA = 'urna_id'
const INTERVALO_ATUALIZACAO = 10000

function lerUrnaSalva() {
  try { return localStorage.getItem(CHAVE_URNA) || '' } catch { return '' }
}

function salvarUrna(id) {
  try {
    if (id) localStorage.setItem(CHAVE_URNA, id)
    else localStorage.removeItem(CHAVE_URNA)
  } catch { /* sem armazenamento local, a urna funciona até recarregar a página */ }
}

const urnaId = ref(lerUrnaSalva())
const carregando = ref(!!urnaId.value)
const urna = ref(null)
const eleicao = ref(null)
const candidatos = ref([])

// 'aguardando' | 'encerrada' | 'bloqueada' | 'votacao' | 'enviando' | 'fim'
const etapa = ref('aguardando')
const eleitor = ref(null)
const liberando = ref(false)
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
  urna.value = dados.urna
  eleicao.value = dados.eleicao
  candidatos.value = dados.candidatos

  // Não interrompe um eleitor que está votando
  if (['votacao', 'enviando', 'fim'].includes(etapa.value)) return
  etapa.value = etapaPorStatus(dados.eleicao.status)
}

async function atualizar() {
  if (!urnaId.value) return
  try {
    const { data } = await api.post('/votacao/conectar', { urnas_id: urnaId.value })
    aplicarDados(data.data)
    if (mensagem.value.tipo === 'warning') avisar('')
  } catch (err) {
    if (err.response?.status === 404) {
      desconectar()
      return
    }
    avisar('Sem comunicação com o servidor. Tentando novamente...', 'warning')
  } finally {
    carregando.value = false
  }
}

function conectado(id, dados) {
  urnaId.value = id
  salvarUrna(id)
  etapa.value = 'aguardando'
  aplicarDados(dados)
  iniciarAtualizacao()
}

function desconectar() {
  pararAtualizacao()
  salvarUrna('')
  urnaId.value = ''
  urna.value = null
  eleicao.value = null
  candidatos.value = []
  eleitor.value = null
  avisar('')
}

async function liberar(matricula) {
  liberando.value = true
  avisar('')
  try {
    const { data } = await api.post('/votacao/identificar', { urnas_id: urnaId.value, matricula })
    eleitor.value = data.data.eleitor
    etapa.value = 'votacao'
  } catch (err) {
    avisar(mensagemErro(err), 'danger')
  } finally {
    liberando.value = false
  }
}

function cancelar() {
  avisar(`Votação de ${eleitor.value?.nome} cancelada. O eleitor pode ser liberado novamente.`, 'secondary')
  eleitor.value = null
  etapa.value = 'bloqueada'
}

async function votar(voto) {
  etapa.value = 'enviando'
  try {
    await api.post('/votacao/votar', { urnas_id: urnaId.value, eleitores_id: eleitor.value.id, ...voto })
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

    <TelaConfiguracao v-else-if="!urna" @conectado="conectado" />

    <template v-else>
      <UrnaEletronica
        :etapa="etapa"
        :eleicao="eleicao"
        :urna="urna"
        :candidatos="candidatos"
        @votar="votar"
      />
      <TerminalMesario
        :etapa="etapa"
        :eleitor="eleitor"
        :liberando="liberando"
        :mensagem="mensagem"
        @liberar="liberar"
        @cancelar="cancelar"
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
