<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Modal } from 'bootstrap'
import api from '../../services/api.js'
import { fotoUrl } from '../../utils/uploads.js'

const route = useRoute()
const id = route.params.id


const loading = ref(true)
const salvando = ref(false)
const excluindo = ref(false)
const erroModal = ref('')
const alerta = ref({ mensagem: '', tipo: 'success' })
const buscaEleitor = ref('')

const eleicao = ref(null)
const candidatos = ref([])
const urnas = ref([])
const eleitores = ref([])
const pessoas = ref([])
const totalEleitores = ref(0)
const totalVotos = ref(0)

const participacao = computed(() =>
    totalEleitores.value > 0 ? Math.round((totalVotos.value / totalEleitores.value) * 100) : 0
)

const candidatosOrdenados = computed(() =>
    [...candidatos.value].sort((a, b) => (b.votos?.length ?? 0) - (a.votos?.length ?? 0))
)

const eleitoresFiltrados = computed(() =>
    eleitores.value.filter(e =>
        !buscaEleitor.value ||
        e.pessoa?.nome?.toLowerCase().includes(buscaEleitor.value.toLowerCase()) ||
        e.pessoa?.matricula?.toLowerCase().includes(buscaEleitor.value.toLowerCase())
    )
)

const todasUrnaApuradas = computed(() =>
    urnas.value.length > 0 && urnas.value.every(u => u.status === 3)
)

// Refs dos modais
const modalEleicaoEl = ref(null)
const modalCandidatoEl = ref(null)
const modalEditarCandidatoEl = ref(null)
const modalUrnaEl = ref(null)
const modalEleitorEl = ref(null)
const modalExcluirEl = ref(null)
const modalAbrirUrnaEl = ref(null)
let bsModalEleicao, bsModalCandidato, bsModalEditarCandidato, bsModalUrna, bsModalEleitor, bsModalExcluir, bsModalAbrirUrna

// Estado do modal de apuração
const urnaAberta = ref(null)
const votosUrnaAberta = ref([])
const totalVotosUrnaAberta = ref(0)
const carregandoVotos = ref(false)
const apurando = ref(false)

// Forms
const formEleicao = ref({ descricao: '', inicio: '', fim: '' })
const formCandidato = ref({ numero: '', descricao: '' })
const fotoCandidatoArquivo = ref(null)
const fotoCandidatoPreview = ref('')
const inputFotoCandidatoEl = ref(null)

// Editar candidato
const candidatoEditando = ref(null)
const formEditarCandidato = ref({ numero: '', descricao: '' })
const fotoEditarArquivo = ref(null)
const fotoEditarPreview = ref('')
const inputFotoEditarEl = ref(null)
const formUrna = ref({ descricao: '' })
const formEleitor = ref({ pessoas_id: '' })
const excluirConfig = ref({ titulo: '', mensagem: '', acao: null })

function formatarData(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function dataParaInput(d) {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 10)
}

function badgeStatus(s) {
  return {
    1: 'bg-secondary-subtle text-secondary',
    2: 'bg-success-subtle text-success',
    3: 'bg-warning-subtle text-warning',
    4: 'bg-danger-subtle text-danger',
  }[s] ?? 'bg-secondary-subtle text-secondary'
}

function labelStatus(s) {
  return { 1: 'Criada', 2: 'Em Andamento', 3: 'Em Apuração', 4: 'Finalizada' }[s] ?? '—'
}

function mostrarAlerta(mensagem, tipo = 'success') {
  alerta.value = { mensagem, tipo }
  setTimeout(() => { alerta.value.mensagem = '' }, 4000)
}

// --- Eleição ---
function abrirModalEleicao() {
  erroModal.value = ''
  formEleicao.value = { descricao: eleicao.value.descricao, inicio: dataParaInput(eleicao.value.inicio), fim: dataParaInput(eleicao.value.fim) }
  bsModalEleicao.show()
}
function fecharModalEleicao() { bsModalEleicao.hide() }

async function salvarEleicao() {
  erroModal.value = ''
  salvando.value = true
  try {
    const { data } = await api.put(`/eleicoes/${id}`, formEleicao.value)
    eleicao.value = { ...eleicao.value, ...data.data }
    mostrarAlerta('Eleição atualizada com sucesso.')
    fecharModalEleicao()
  } catch (err) {
    erroModal.value = err.response?.data?.message || 'Erro ao salvar.'
  } finally {
    salvando.value = false
  }
}

async function alterarStatus(novoStatus) {
  try {
    const { data } = await api.put(`/eleicoes/${id}`, { status: novoStatus })
    eleicao.value = { ...eleicao.value, ...data.data }
    mostrarAlerta(`Status alterado para "${labelStatus(novoStatus)}".`)
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao alterar status.', 'danger')
  }
}

// --- Candidato ---
function onFotoCandidatoChange(e) {
  const file = e.target.files[0]
  if (!file) return
  fotoCandidatoArquivo.value = file
  fotoCandidatoPreview.value = URL.createObjectURL(file)
}

function abrirModalCandidato() {
  erroModal.value = ''
  formCandidato.value = { numero: '', descricao: '' }
  fotoCandidatoArquivo.value = null
  fotoCandidatoPreview.value = ''
  if (inputFotoCandidatoEl.value) inputFotoCandidatoEl.value.value = ''
  bsModalCandidato.show()
}
function fecharModalCandidato() { bsModalCandidato.hide() }

async function salvarCandidato() {
  erroModal.value = ''
  salvando.value = true
  try {
    const fd = new FormData()
    fd.append('numero', formCandidato.value.numero)
    fd.append('descricao', formCandidato.value.descricao || '')
    fd.append('eleicoes_id', id)
    if (fotoCandidatoArquivo.value) fd.append('foto', fotoCandidatoArquivo.value)

    const { data } = await api.post('/candidatos', fd)
    candidatos.value.push({ ...data.data, votos: [] })
    mostrarAlerta('Candidato adicionado.')
    fecharModalCandidato()
  } catch (err) {
    erroModal.value = err.response?.data?.message || 'Erro ao salvar.'
  } finally {
    salvando.value = false
  }
}

function confirmarExclusaoCandidato(c) {
  excluirConfig.value = {
    titulo: 'Excluir candidato',
    mensagem: `Tem certeza que deseja excluir "${c.descricao}"?`,
    acao: () => excluirCandidato(c.id),
  }
  bsModalExcluir.show()
}

async function excluirCandidato(cid) {
  excluindo.value = true
  try {
    await api.delete(`/candidatos/${cid}`)
    candidatos.value = candidatos.value.filter(c => c.id !== cid)
    mostrarAlerta('Candidato excluído.')
    fecharModalExcluir()
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao excluir.', 'danger')
    fecharModalExcluir()
  } finally {
    excluindo.value = false
  }
}

function abrirModalEditarCandidato(c) {
  erroModal.value = ''
  candidatoEditando.value = c
  formEditarCandidato.value = { numero: c.numero, descricao: c.descricao }
  fotoEditarArquivo.value = null
  fotoEditarPreview.value = c.foto || ''
  if (inputFotoEditarEl.value) inputFotoEditarEl.value.value = ''
  bsModalEditarCandidato.show()
}
function fecharModalEditarCandidato() { bsModalEditarCandidato.hide() }

function onFotoEditarChange(e) {
  const file = e.target.files[0]
  if (!file) return
  fotoEditarArquivo.value = file
  fotoEditarPreview.value = URL.createObjectURL(file)
}

async function salvarEditarCandidato() {
  erroModal.value = ''
  salvando.value = true
  try {
    const fd = new FormData()
    fd.append('numero', formEditarCandidato.value.numero)
    fd.append('descricao', formEditarCandidato.value.descricao || '')
    if (fotoEditarArquivo.value) fd.append('foto', fotoEditarArquivo.value)

    const { data } = await api.put(`/candidatos/${candidatoEditando.value.id}`, fd)
    const idx = candidatos.value.findIndex(c => c.id === candidatoEditando.value.id)
    if (idx !== -1) candidatos.value[idx] = { ...candidatos.value[idx], ...data.data }
    mostrarAlerta('Candidato atualizado.')
    fecharModalEditarCandidato()
  } catch (err) {
    erroModal.value = err.response?.data?.message || 'Erro ao salvar.'
  } finally {
    salvando.value = false
  }
}

// --- Urna ---
function abrirModalUrna() {
  erroModal.value = ''
  formUrna.value = { descricao: '' }
  bsModalUrna.show()
}
function fecharModalUrna() { bsModalUrna.hide() }

async function salvarUrna() {
  erroModal.value = ''
  salvando.value = true
  try {
    const { data } = await api.post('/urnas', { ...formUrna.value, eleicoes_id: id })
    urnas.value.push(data.data)
    mostrarAlerta('Urna adicionada.')
    fecharModalUrna()
  } catch (err) {
    erroModal.value = err.response?.data?.message || 'Erro ao salvar.'
  } finally {
    salvando.value = false
  }
}

function badgeUrnaStatus(s) {
  return { 1: 'bg-secondary-subtle text-secondary', 2: 'bg-success-subtle text-success', 3: 'bg-info-subtle text-info' }[s] ?? 'bg-secondary-subtle text-secondary'
}

function labelUrnaStatus(s) {
  return { 1: 'Fechada', 2: 'Aberta', 3: 'Apurada' }[s] ?? '—'
}

async function alterarStatusUrna(urna, novoStatus) {
  try {
    await api.put(`/urnas/${urna.id}`, { status: novoStatus })
    urna.status = novoStatus
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao atualizar urna.', 'danger')
  }
}

function confirmarExclusaoUrna(u) {
  excluirConfig.value = {
    titulo: 'Excluir urna',
    mensagem: `Tem certeza que deseja excluir "${u.descricao}"?`,
    acao: () => excluirUrna(u.id),
  }
  bsModalExcluir.show()
}

async function excluirUrna(uid) {
  excluindo.value = true
  try {
    await api.delete(`/urnas/${uid}`)
    urnas.value = urnas.value.filter(u => u.id !== uid)
    mostrarAlerta('Urna excluída.')
    fecharModalExcluir()
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao excluir.', 'danger')
    fecharModalExcluir()
  } finally {
    excluindo.value = false
  }
}

function abrirTerminal(urnaId) {
  window.open(`/terminal/${urnaId}`, '_blank')
}

// --- Abrir / Apurar Urna ---
async function abrirUrna(u) {
  urnaAberta.value = u
  votosUrnaAberta.value = []
  totalVotosUrnaAberta.value = 0
  carregandoVotos.value = true
  bsModalAbrirUrna.show()
  try {
    const { data } = await api.get(`/urnas/${u.id}/votos`)
    votosUrnaAberta.value = data.data.votos || []
    totalVotosUrnaAberta.value = data.data.totalVotos || 0
  } finally {
    carregandoVotos.value = false
  }
}

function fecharModalAbrirUrna() { bsModalAbrirUrna.hide() }

async function apurarUrna() {
  apurando.value = true
  try {
    await api.put(`/urnas/${urnaAberta.value.id}/apurar`)
    // Atualiza status local da urna
    const idx = urnas.value.findIndex(u => u.id === urnaAberta.value.id)
    if (idx !== -1) urnas.value[idx].status = 3
    urnaAberta.value = { ...urnaAberta.value, status: 3 }
    mostrarAlerta('Urna apurada com sucesso.')
    // Recarrega o resultado para refletir os votos apurados
    const { data } = await api.get(`/eleicoes/${id}/resultado`)
    candidatos.value = data.data.candidatos || []
    totalVotos.value = data.data.totalVotos || 0
    fecharModalAbrirUrna()
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao apurar.', 'danger')
  } finally {
    apurando.value = false
  }
}

// --- Eleitor ---
function abrirModalEleitor() {
  erroModal.value = ''
  formEleitor.value = { pessoas_id: '' }
  bsModalEleitor.show()
}
function fecharModalEleitor() { bsModalEleitor.hide() }

async function salvarEleitor() {
  erroModal.value = ''
  salvando.value = true
  try {
    const { data } = await api.post('/eleitores', { pessoas_id: formEleitor.value.pessoas_id, eleicoes_id: id })
    const detalhe = await api.get(`/eleitores/${data.data.id}`)
    eleitores.value.push(detalhe.data.data)
    totalEleitores.value++
    mostrarAlerta('Eleitor inscrito.')
    fecharModalEleitor()
  } catch (err) {
    erroModal.value = err.response?.data?.message || 'Erro ao inscrever.'
  } finally {
    salvando.value = false
  }
}

async function liberarEleitor(e) {
  try {
    await api.put(`/eleitores/${e.id}/liberar`)
    const idx = eleitores.value.findIndex(el => el.id === e.id)
    if (idx !== -1) eleitores.value[idx].status = 1
    mostrarAlerta(`${e.pessoa?.nome} liberado para votar.`)
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao liberar eleitor.', 'danger')
  }
}

function confirmarExclusaoEleitor(e) {
  excluirConfig.value = {
    titulo: 'Remover eleitor',
    mensagem: `Remover "${e.pessoa?.nome}" desta eleição?`,
    acao: () => excluirEleitor(e.id),
  }
  bsModalExcluir.show()
}

async function excluirEleitor(eid) {
  excluindo.value = true
  try {
    await api.delete(`/eleitores/${eid}`)
    eleitores.value = eleitores.value.filter(e => e.id !== eid)
    totalEleitores.value--
    mostrarAlerta('Eleitor removido.')
    fecharModalExcluir()
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao remover.', 'danger')
    fecharModalExcluir()
  } finally {
    excluindo.value = false
  }
}

function fecharModalExcluir() { bsModalExcluir.hide() }

onMounted(async () => {
  bsModalEleicao = new Modal(modalEleicaoEl.value)
  bsModalCandidato = new Modal(modalCandidatoEl.value)
  bsModalEditarCandidato = new Modal(modalEditarCandidatoEl.value)
  bsModalUrna = new Modal(modalUrnaEl.value)
  bsModalEleitor = new Modal(modalEleitorEl.value)
  bsModalExcluir = new Modal(modalExcluirEl.value)
  bsModalAbrirUrna = new Modal(modalAbrirUrnaEl.value)

  try {
    const [resDetalhe, resResultado, resEleitores, resPessoas] = await Promise.all([
      api.get(`/eleicoes/${id}`),
      api.get(`/eleicoes/${id}/resultado`),
      api.get(`/eleitores?eleicao=${id}`),
      api.get('/pessoas'),
    ])

    eleicao.value = resDetalhe.data.data
    urnas.value = resDetalhe.data.data.urnas || []

    candidatos.value = resResultado.data.data.candidatos || []
    totalEleitores.value = resResultado.data.data.totalEleitores || 0
    totalVotos.value = resResultado.data.data.totalVotos || 0

    eleitores.value = resEleitores.data.data || []
    pessoas.value = resPessoas.data.data || []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-items-start gap-3 mb-4">
      <RouterLink to="/eleicoes" class="btn btn-sm btn-outline-secondary mt-1">
        <i class="bi bi-arrow-left"></i>
      </RouterLink>
      <div class="flex-grow-1">
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <h5 class="fw-bold mb-0">{{ eleicao?.descricao || '...' }}</h5>
          <span v-if="eleicao" :class="['badge rounded-pill', badgeStatus(eleicao.status)]">
            {{ labelStatus(eleicao.status) }}
          </span>
        </div>
        <p class="text-muted small mb-0 mt-1">
          <span v-if="eleicao?.inicio || eleicao?.fim">
            <i class="bi bi-calendar3 me-1"></i>
            {{ formatarData(eleicao.inicio) }} → {{ formatarData(eleicao.fim) }}
          </span>
          <span v-else>Sem datas definidas</span>
        </p>
      </div>
      <div class="d-flex gap-2">
        <button
          v-if="eleicao?.status === 1"
          class="btn btn-sm btn-success"
          @click="alterarStatus(2)"
        >
          <i class="bi bi-play-fill me-1"></i>Iniciar
        </button>
        <button
          v-else-if="eleicao?.status === 2"
          class="btn btn-sm btn-warning"
          @click="alterarStatus(3)"
        >
          <i class="bi bi-clock-fill me-1"></i>Encerrar Votação
        </button>
        <button
          v-else-if="eleicao?.status === 3"
          class="btn btn-sm btn-danger"
          :disabled="!todasUrnaApuradas"
          :title="!todasUrnaApuradas ? 'Todas as urnas precisam ser apuradas' : 'Finalizar eleição'"
          @click="alterarStatus(4)"
        >
          <i class="bi bi-flag-fill me-1"></i>Finalizar
        </button>
        <button
          v-if="eleicao?.status === 1"
          class="btn btn-sm btn-primary"
          @click="abrirModalEleicao"
        >
          <i class="bi bi-pencil me-1"></i>Editar
        </button>
      </div>
    </div>

    <div v-if="alerta.mensagem" :class="['alert alert-dismissible fade show', `alert-${alerta.tipo}`]" role="alert">
      {{ alerta.mensagem }}
      <button type="button" class="btn-close" @click="alerta.mensagem = ''"></button>
    </div>

    <!-- Skeleton de carregamento inicial -->
    <div v-if="loading">
      <div class="row g-3 mb-4">
        <div v-for="n in 4" :key="n" class="col-6 col-xl-3">
          <div class="card border-0 shadow-sm placeholder-glow">
            <div class="card-body"><span class="placeholder col-8 rounded" style="height:48px"></span></div>
          </div>
        </div>
      </div>
    </div>

    <template v-else>
      <!-- Cards de totais -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-xl-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <p class="text-muted small mb-1">Candidatos</p>
              <h3 class="fw-bold mb-0">{{ candidatos.length }}</h3>
            </div>
          </div>
        </div>
        <div class="col-6 col-xl-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <p class="text-muted small mb-1">Eleitores</p>
              <h3 class="fw-bold mb-0">{{ totalEleitores }}</h3>
            </div>
          </div>
        </div>
        <div class="col-6 col-xl-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <p class="text-muted small mb-1">Votos computados</p>
              <h3 class="fw-bold mb-0">{{ totalVotos }}</h3>
            </div>
          </div>
        </div>
        <div class="col-6 col-xl-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <p class="text-muted small mb-1">Participação</p>
              <h3 class="fw-bold mb-0">{{ participacao }}%</h3>
              <div class="progress mt-2" style="height:4px">
                <div class="progress-bar bg-primary" :style="`width:${participacao}%`"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Resultado + Urnas -->
      <div class="row g-3 mb-3">
        <!-- Resultado dos candidatos -->
        <div class="col-12 col-xl-7">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-0 d-flex align-items-center justify-content-between py-3">
              <h6 class="fw-bold mb-0"><i class="bi bi-bar-chart-fill text-primary me-2"></i>Resultado parcial</h6>
              <button class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" @click="abrirModalCandidato()">
                <i class="bi bi-plus-lg"></i> Candidato
              </button>
            </div>
            <div class="card-body p-3">
              <div v-if="candidatos.length === 0" class="text-center py-4 text-muted">
                <i class="bi bi-person-badge fs-2 d-block mb-2"></i>
                Nenhum candidato cadastrado
              </div>
              <div v-else class="candidatos-lista">
                <div
                  v-for="(c, idx) in candidatosOrdenados"
                  :key="c.id"
                  class="candidato-item"
                  :class="{
                    'candidato-item--lider': idx === 0 && totalVotos > 0 && eleicao?.status !== 4,
                    'candidato-item--eleito': idx === 0 && eleicao?.status === 4 && totalVotos > 0,
                  }"
                >
                  <div class="candidato-item__foto">
                    <img v-if="c.foto" :src="fotoUrl(c.foto)" :alt="c.descricao" />
                    <div v-else class="candidato-item__foto-empty"><i class="bi bi-person-fill"></i></div>
                    <span v-if="idx === 0 && totalVotos > 0 && eleicao?.status !== 4" class="candidato-item__trophy"><i class="bi bi-trophy-fill"></i></span>
                  </div>
                  <div class="candidato-item__info">
                    <div class="d-flex align-items-center justify-content-between mb-1">
                      <div class="d-flex align-items-center gap-2 flex-wrap">
                        <span class="badge bg-secondary-subtle text-secondary fw-bold px-2">Nº {{ c.numero }}</span>
                        <span class="fw-semibold">{{ c.descricao }}</span>
                        <span v-if="idx === 0 && eleicao?.status === 4 && totalVotos > 0" class="badge bg-success text-white d-flex align-items-center gap-1">
                          <i class="bi bi-patch-check-fill"></i> Eleito
                        </span>
                      </div>
                      <div class="d-flex align-items-center gap-3">
                        <span class="fw-bold text-primary">{{ c.votos.length }} <span class="text-muted fw-normal small">voto{{ c.votos.length !== 1 ? 's' : '' }}</span></span>
                        <div class="d-flex gap-1">
                          <button class="btn btn-sm btn-light border px-2 py-1" @click="abrirModalEditarCandidato(c)" title="Editar">
                            <i class="bi bi-pencil small text-primary"></i>
                          </button>
                          <button class="btn btn-sm btn-light border px-2 py-1" @click="confirmarExclusaoCandidato(c)" title="Excluir">
                            <i class="bi bi-trash small text-danger"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div class="progress" style="height:6px; border-radius:3px">
                      <div
                        class="progress-bar"
                        :class="idx === 0 && eleicao?.status === 4 && totalVotos > 0 ? 'bg-success' : idx === 0 && totalVotos > 0 ? 'bg-warning' : 'bg-primary'"
                        :style="`width:${totalVotos > 0 ? Math.round((c.votos.length / totalVotos) * 100) : 0}%`"
                      ></div>
                    </div>
                    <div class="text-end mt-1">
                      <span class="small text-muted">{{ totalVotos > 0 ? Math.round((c.votos.length / totalVotos) * 100) : 0 }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Urnas -->
        <div class="col-12 col-xl-5">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-0 d-flex align-items-center justify-content-between py-3">
              <h6 class="fw-bold mb-0"><i class="bi bi-archive-fill text-warning me-2"></i>Urnas</h6>
              <button class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" @click="abrirModalUrna()">
                <i class="bi bi-plus-lg"></i> Urna
              </button>
            </div>
            <div class="card-body p-0">
              <div v-if="urnas.length === 0" class="text-center py-4 text-muted">
                <i class="bi bi-archive fs-2 d-block mb-2"></i>
                Nenhuma urna cadastrada
              </div>
              <ul v-else class="list-group list-group-flush">
                <li v-for="u in urnas" :key="u.id" class="list-group-item d-flex align-items-center justify-content-between py-3">
                  <div>
                    <p class="fw-semibold small mb-0">{{ u.descricao }}</p>
                    <span :class="['badge rounded-pill mt-1', badgeUrnaStatus(u.status)]">
                      {{ labelUrnaStatus(u.status) }}
                    </span>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <button
                      class="btn btn-sm btn-outline-primary"
                      :disabled="eleicao?.status !== 2"
                      :title="eleicao?.status !== 2 ? 'Disponível apenas com a eleição Em Andamento' : 'Abrir terminal de votação'"
                      @click="abrirTerminal(u.id)"
                    >
                      <i class="bi bi-display me-1"></i>Terminal
                    </button>
                    <button
                      class="btn btn-sm btn-outline-success"
                      :disabled="eleicao?.status !== 3"
                      :title="eleicao?.status !== 3 ? 'Disponível apenas com a eleição Finalizada' : 'Abrir urna'"
                      @click="abrirUrna(u)"
                    >
                      <i class="bi bi-box-arrow-up-right me-1"></i>Abrir
                    </button>
                    <button class="btn btn-sm btn-link text-danger p-0" @click="confirmarExclusaoUrna(u)">
                      <i class="bi bi-trash small"></i>
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Eleitores -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-0 d-flex align-items-center justify-content-between py-3">
          <h6 class="fw-bold mb-0"><i class="bi bi-people-fill text-info me-2"></i>Eleitores</h6>
          <div class="d-flex align-items-center gap-2">
            <div class="input-group input-group-sm" style="max-width:220px">
              <span class="input-group-text bg-light border-end-0"><i class="bi bi-search text-muted"></i></span>
              <input v-model="buscaEleitor" type="text" class="form-control border-start-0" placeholder="Buscar..." />
            </div>
            <button class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" @click="abrirModalEleitor()">
              <i class="bi bi-plus-lg"></i> Eleitor
            </button>
          </div>
        </div>
        <div class="card-body p-0">
          <div v-if="eleitoresFiltrados.length === 0" class="text-center py-4 text-muted">
            <i class="bi bi-person-x fs-2 d-block mb-2"></i>
            Nenhum eleitor inscrito
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="small fw-semibold ps-4">Nome</th>
                  <th class="small fw-semibold">Matrícula</th>
                  <th class="small fw-semibold">Curso</th>
                  <th class="small fw-semibold">Situação</th>
                  <th class="small fw-semibold text-end pe-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="e in eleitoresFiltrados" :key="e.id">
                  <td class="ps-4 fw-semibold small">{{ e.pessoa?.nome || '—' }}</td>
                  <td class="small text-muted">{{ e.pessoa?.matricula || '—' }}</td>
                  <td class="small text-muted">{{ e.pessoa?.curso || '—' }}</td>
                  <td>
                    <span :class="['badge rounded-pill',
                      e.status === 2 ? 'bg-success-subtle text-success' :
                      e.status === 1 ? 'bg-primary-subtle text-primary' :
                      e.status === 3 ? 'bg-danger-subtle text-danger' :
                      'bg-warning-subtle text-warning'
                    ]">
                      {{ e.status === 2 ? 'Votou' : e.status === 1 ? 'Liberado' : e.status === 3 ? 'Faltou' : 'Pendente' }}
                    </span>
                  </td>
                  <td class="text-end pe-4">
                    <button
                      class="btn btn-sm btn-outline-success me-1"
                      :disabled="e.status !== 0 || eleicao?.status !== 2"
                      :title="eleicao?.status !== 2 ? 'A eleição precisa estar Em Andamento' : 'Liberar para votar'"
                      @click="liberarEleitor(e)"
                    >
                      <i class="bi bi-unlock"></i> Liberar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" :disabled="e.status === 2" @click="confirmarExclusaoEleitor(e)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal Editar Eleição -->
    <div class="modal fade" tabindex="-1" ref="modalEleicaoEl">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Editar Eleição</h5>
            <button type="button" class="btn-close" @click="fecharModalEleicao"></button>
          </div>
          <form @submit.prevent="salvarEleicao">
            <div class="modal-body">
              <div v-if="erroModal" class="alert alert-danger py-2 small">{{ erroModal }}</div>
              <div class="mb-3">
                <label class="form-label small fw-semibold">Descrição <span class="text-danger">*</span></label>
                <input v-model="formEleicao.descricao" type="text" class="form-control" maxlength="100" required />
              </div>
              <div class="row g-3 mb-1">
                <div class="col-6">
                  <label class="form-label small fw-semibold">Data de Início</label>
                  <input v-model="formEleicao.inicio" type="date" class="form-control" />
                </div>
                <div class="col-6">
                  <label class="form-label small fw-semibold">Data de Fim</label>
                  <input v-model="formEleicao.fim" type="date" class="form-control" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="fecharModalEleicao">Cancelar</button>
              <button type="submit" class="btn btn-primary d-flex align-items-center gap-2" :disabled="salvando">
                <span v-if="salvando" class="spinner-border spinner-border-sm"></span>
                Salvar alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Candidato -->
    <div class="modal fade" tabindex="-1" ref="modalCandidatoEl">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Novo Candidato</h5>
            <button type="button" class="btn-close" @click="fecharModalCandidato"></button>
          </div>
          <form @submit.prevent="salvarCandidato">
            <div class="modal-body">
              <div v-if="erroModal" class="alert alert-danger py-2 small">{{ erroModal }}</div>
              <div class="mb-3">
                <label class="form-label small fw-semibold">Número <span class="text-danger">*</span></label>
                <input v-model.number="formCandidato.numero" type="number" min="1" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label small fw-semibold">Descrição / Nome</label>
                <input v-model="formCandidato.descricao" type="text" class="form-control" maxlength="100" />
              </div>
              <div class="mb-1">
                <label class="form-label small fw-semibold">Foto</label>
                <div class="d-flex align-items-center gap-3">
                  <div class="foto-preview-wrap">
                    <img v-if="fotoCandidatoPreview" :src="fotoCandidatoPreview" class="foto-preview" alt="Preview" />
                    <div v-else class="foto-preview foto-preview--empty">
                      <i class="bi bi-person-fill fs-4 text-muted"></i>
                    </div>
                  </div>
                  <div class="flex-grow-1">
                    <input ref="inputFotoCandidatoEl" type="file" accept="image/*" class="form-control form-control-sm" @change="onFotoCandidatoChange" />
                    <div class="form-text">JPG, PNG ou WEBP — máx. 2 MB</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="fecharModalCandidato">Cancelar</button>
              <button type="submit" class="btn btn-primary d-flex align-items-center gap-2" :disabled="salvando">
                <span v-if="salvando" class="spinner-border spinner-border-sm"></span>
                Adicionar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Editar Candidato -->
    <div class="modal fade" tabindex="-1" ref="modalEditarCandidatoEl">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Editar Candidato</h5>
            <button type="button" class="btn-close" @click="fecharModalEditarCandidato"></button>
          </div>
          <form @submit.prevent="salvarEditarCandidato">
            <div class="modal-body">
              <div v-if="erroModal" class="alert alert-danger py-2 small">{{ erroModal }}</div>
              <div class="mb-3">
                <label class="form-label small fw-semibold">Número <span class="text-danger">*</span></label>
                <input v-model.number="formEditarCandidato.numero" type="number" min="1" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label small fw-semibold">Descrição / Nome</label>
                <input v-model="formEditarCandidato.descricao" type="text" class="form-control" maxlength="100" />
              </div>
              <div class="mb-1">
                <label class="form-label small fw-semibold">Foto</label>
                <div class="d-flex align-items-center gap-3">
                  <div class="foto-preview-wrap">
                    <img v-if="fotoEditarPreview" :src="fotoEditarPreview" class="foto-preview" alt="Preview" />
                    <div v-else class="foto-preview foto-preview--empty">
                      <i class="bi bi-person-fill fs-4 text-muted"></i>
                    </div>
                  </div>
                  <div class="flex-grow-1">
                    <input ref="inputFotoEditarEl" type="file" accept="image/*" class="form-control form-control-sm" @change="onFotoEditarChange" />
                    <div class="form-text">JPG, PNG ou WEBP — máx. 2 MB. Deixe em branco para manter a foto atual.</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="fecharModalEditarCandidato">Cancelar</button>
              <button type="submit" class="btn btn-primary d-flex align-items-center gap-2" :disabled="salvando">
                <span v-if="salvando" class="spinner-border spinner-border-sm"></span>
                Salvar alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Urna -->
    <div class="modal fade" tabindex="-1" ref="modalUrnaEl">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Nova Urna</h5>
            <button type="button" class="btn-close" @click="fecharModalUrna"></button>
          </div>
          <form @submit.prevent="salvarUrna">
            <div class="modal-body">
              <div v-if="erroModal" class="alert alert-danger py-2 small">{{ erroModal }}</div>
              <div class="mb-1">
                <label class="form-label small fw-semibold">Descrição <span class="text-danger">*</span></label>
                <input v-model="formUrna.descricao" type="text" class="form-control" maxlength="100" required />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="fecharModalUrna">Cancelar</button>
              <button type="submit" class="btn btn-primary d-flex align-items-center gap-2" :disabled="salvando">
                <span v-if="salvando" class="spinner-border spinner-border-sm"></span>
                Adicionar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Eleitor -->
    <div class="modal fade" tabindex="-1" ref="modalEleitorEl">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Inscrever Eleitor</h5>
            <button type="button" class="btn-close" @click="fecharModalEleitor"></button>
          </div>
          <form @submit.prevent="salvarEleitor">
            <div class="modal-body">
              <div v-if="erroModal" class="alert alert-danger py-2 small">{{ erroModal }}</div>
              <div class="mb-1">
                <label class="form-label small fw-semibold">Pessoa <span class="text-danger">*</span></label>
                <select v-model="formEleitor.pessoas_id" class="form-select" required>
                  <option value="">Selecione uma pessoa</option>
                  <option v-for="p in pessoas" :key="p.id" :value="p.id">
                    {{ p.nome }} {{ p.matricula ? `(${p.matricula})` : '' }}
                  </option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="fecharModalEleitor">Cancelar</button>
              <button type="submit" class="btn btn-primary d-flex align-items-center gap-2" :disabled="salvando">
                <span v-if="salvando" class="spinner-border spinner-border-sm"></span>
                Inscrever
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Abrir Urna / Apuração -->
    <div class="modal fade" tabindex="-1" ref="modalAbrirUrnaEl">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h5 class="modal-title fw-bold">
                <i class="bi bi-archive-fill text-warning me-2"></i>{{ urnaAberta?.descricao }}
              </h5>
              <span v-if="urnaAberta" :class="['badge rounded-pill', badgeUrnaStatus(urnaAberta.status)]">
                {{ labelUrnaStatus(urnaAberta.status) }}
              </span>
            </div>
            <button type="button" class="btn-close ms-auto" @click="fecharModalAbrirUrna"></button>
          </div>
          <div class="modal-body">
            <div v-if="carregandoVotos" class="py-4">
              <div v-for="n in 3" :key="n" class="placeholder-glow mb-3">
                <span class="placeholder col-12 rounded" style="height:32px"></span>
              </div>
            </div>
            <div v-else-if="votosUrnaAberta.length === 0" class="text-center py-5 text-muted">
              <i class="bi bi-inbox fs-2 d-block mb-2"></i>
              Nenhum voto depositado nesta urna
            </div>
            <div v-else>
              <p class="text-muted small mb-3">
                Total de votos depositados: <strong>{{ totalVotosUrnaAberta }}</strong>
              </p>
              <div class="urna-cards-grid">
                <div
                  v-for="(voto, idx) in votosUrnaAberta"
                  :key="voto.id"
                  class="urna-voto-card"
                >
                  <div class="urna-voto-card__seq">#{{ idx + 1 }}</div>
                  <div class="urna-voto-card__foto">
                    <img v-if="voto.candidato?.foto" :src="fotoUrl(voto.candidato.foto)" :alt="voto.candidato.descricao" />
                    <div v-else class="urna-voto-card__foto-empty"><i class="bi bi-person-fill"></i></div>
                  </div>
                  <div class="urna-voto-card__numero">{{ voto.candidato?.numero }}</div>
                  <div class="urna-voto-card__nome">{{ voto.candidato?.descricao }}</div>
                </div>
              </div>
            </div>

            <div v-if="urnaAberta?.status === 3" class="alert alert-info py-2 small mb-0 mt-3">
              <i class="bi bi-check-circle-fill me-1"></i> Esta urna já foi apurada e seus votos estão contabilizados no resultado.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="fecharModalAbrirUrna">Fechar</button>
            <button
              type="button"
              class="btn btn-success d-flex align-items-center gap-2"
              :disabled="apurando || urnaAberta?.status === 3 || carregandoVotos"
              @click="apurarUrna"
            >
              <span v-if="apurando" class="spinner-border spinner-border-sm"></span>
              <i v-else class="bi bi-check2-all"></i>
              {{ urnaAberta?.status === 3 ? 'Já apurada' : 'Apurar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Confirmar Exclusão -->
    <div class="modal fade" tabindex="-1" ref="modalExcluirEl">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <h6 class="modal-title fw-bold">{{ excluirConfig.titulo }}</h6>
            <button type="button" class="btn-close" @click="fecharModalExcluir"></button>
          </div>
          <div class="modal-body pt-2">
            <p class="small mb-0">{{ excluirConfig.mensagem }}</p>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary btn-sm" @click="fecharModalExcluir">Cancelar</button>
            <button type="button" class="btn btn-danger btn-sm d-flex align-items-center gap-2" @click="excluirConfig.acao" :disabled="excluindo">
              <span v-if="excluindo" class="spinner-border spinner-border-sm"></span>
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>



<style scoped>
.card-header {
  border-bottom: 1px solid #f0f0f0 !important;
}

/* Cards de votos da urna */
.urna-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
}

.urna-voto-card {
  position: relative;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 14px 10px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  text-align: center;
}

.urna-voto-card__seq {
  position: absolute;
  top: 5px;
  left: 8px;
  font-size: 0.65rem;
  color: #adb5bd;
  font-weight: 600;
}

.urna-voto-card__foto {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #dee2e6;
}

.urna-voto-card__foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.urna-voto-card__foto-empty {
  width: 100%;
  height: 100%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: #adb5bd;
}

.urna-voto-card__numero {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0d6efd;
  line-height: 1;
}

.urna-voto-card__nome {
  font-size: 0.72rem;
  font-weight: 600;
  color: #495057;
  line-height: 1.3;
}

/* Lista de candidatos */
.candidatos-lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.candidato-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  transition: border-color 0.2s;
}

.candidato-item--lider {
  background: #fffdf0;
  border-color: #ffc107;
}

.candidato-item--eleito {
  background: #f0fff4;
  border-color: #198754;
}

.candidato-item--eleito .candidato-item__foto img,
.candidato-item--eleito .candidato-item__foto-empty {
  border-color: #198754 !important;
}

.candidato-item--eleito .candidato-item__trophy {
  background: #198754 !important;
}

.candidato-item__foto {
  position: relative;
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: visible;
}

.candidato-item__foto img,
.candidato-item__foto-empty {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #dee2e6;
  display: block;
}

.candidato-item--lider .candidato-item__foto img,
.candidato-item--lider .candidato-item__foto-empty {
  border-color: #ffc107;
}

.candidato-item__foto-empty {
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: #adb5bd;
}

.candidato-item__trophy {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: #ffc107;
  color: #fff;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  border: 2px solid #fff;
}

.candidato-item__info {
  flex: 1;
  min-width: 0;
}

.foto-preview-wrap { flex-shrink: 0; }

.foto-preview {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #dee2e6;
  display: block;
}

.foto-preview--empty {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
