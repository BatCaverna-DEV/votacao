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
const confirmando = ref(false)
const erroModal = ref('')
const alerta = ref({ mensagem: '', tipo: 'success' })
const buscaEleitor = ref('')

const eleicao = ref(null)
const candidatos = ref([])
const urnas = ref([])
const eleitores = ref([])
const pessoas = ref([])

// Os dados só podem ser alterados enquanto a eleição não foi iniciada
const editavel = computed(() => eleicao.value?.status === 1)

const candidatosOrdenados = computed(() =>
    [...candidatos.value].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
)

const eleitoresFiltrados = computed(() =>
    eleitores.value.filter(e =>
        !buscaEleitor.value ||
        e.pessoa?.nome?.toLowerCase().includes(buscaEleitor.value.toLowerCase()) ||
        e.pessoa?.matricula?.toLowerCase().includes(buscaEleitor.value.toLowerCase())
    )
)

// Refs dos modais
const modalEleicaoEl = ref(null)
const modalCandidatoEl = ref(null)
const modalEditarCandidatoEl = ref(null)
const modalUrnaEl = ref(null)
const modalEleitorEl = ref(null)
const modalConfirmarEl = ref(null)
let bsModalEleicao, bsModalCandidato, bsModalEditarCandidato, bsModalUrna, bsModalEleitor, bsModalConfirmar

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
const confirmarConfig = ref({ titulo: '', mensagem: '', botao: '', classe: 'btn-danger', acao: null })

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
    3: 'bg-danger-subtle text-danger',
    4: 'bg-danger-subtle text-danger',
  }[s] ?? 'bg-secondary-subtle text-secondary'
}

function labelStatus(s) {
  return { 1: 'Não iniciada', 2: 'Em andamento', 3: 'Encerrada', 4: 'Encerrada' }[s] ?? '—'
}

function mostrarAlerta(mensagem, tipo = 'success') {
  alerta.value = { mensagem, tipo }
  setTimeout(() => { alerta.value.mensagem = '' }, 4000)
}

async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto)
    mostrarAlerta('Identificador copiado.')
  } catch {
    mostrarAlerta('Não foi possível copiar.', 'danger')
  }
}

// --- Confirmação genérica ---
function abrirConfirmacao(config) {
  confirmarConfig.value = { botao: 'Excluir', classe: 'btn-danger', ...config }
  bsModalConfirmar.show()
}
function fecharModalConfirmar() { bsModalConfirmar.hide() }

async function executarConfirmacao() {
  confirmando.value = true
  try {
    await confirmarConfig.value.acao()
  } finally {
    confirmando.value = false
    fecharModalConfirmar()
  }
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
    const { data } = await api.put(`/eleicoes/${id}`, {
      descricao: formEleicao.value.descricao,
      inicio: formEleicao.value.inicio || null,
      fim: formEleicao.value.fim || null,
    })
    eleicao.value = { ...eleicao.value, ...data.data }
    mostrarAlerta('Eleição atualizada com sucesso.')
    fecharModalEleicao()
  } catch (err) {
    erroModal.value = err.response?.data?.message || 'Erro ao salvar.'
  } finally {
    salvando.value = false
  }
}

function confirmarIniciar() {
  abrirConfirmacao({
    titulo: 'Iniciar eleição',
    mensagem: 'Depois de iniciada, a eleição fica disponível para as urnas e seus candidatos, urnas e eleitores não poderão mais ser alterados.',
    botao: 'Iniciar',
    classe: 'btn-success',
    acao: () => alterarSituacao('iniciar'),
  })
}

function confirmarEncerrar() {
  abrirConfirmacao({
    titulo: 'Encerrar eleição',
    mensagem: 'As urnas deixarão de aceitar votos e os eleitores que não votaram serão marcados como faltosos. Esta ação não pode ser desfeita.',
    botao: 'Encerrar',
    classe: 'btn-danger',
    acao: () => alterarSituacao('encerrar'),
  })
}

async function alterarSituacao(acao) {
  try {
    const { data } = await api.put(`/eleicoes/${id}/${acao}`)
    eleicao.value = { ...eleicao.value, ...data.data }
    mostrarAlerta(data.message)
    if (acao === 'encerrar') {
      const res = await api.get(`/eleitores?eleicao=${id}`)
      eleitores.value = res.data.data || []
    }
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao alterar a situação da eleição.', 'danger')
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
    candidatos.value.push(data.data)
    mostrarAlerta('Candidato adicionado.')
    fecharModalCandidato()
  } catch (err) {
    erroModal.value = err.response?.data?.message || 'Erro ao salvar.'
  } finally {
    salvando.value = false
  }
}

function confirmarExclusaoCandidato(c) {
  abrirConfirmacao({
    titulo: 'Excluir candidato',
    mensagem: `Tem certeza que deseja excluir "${c.descricao}"?`,
    acao: () => excluirCandidato(c.id),
  })
}

async function excluirCandidato(cid) {
  try {
    await api.delete(`/candidatos/${cid}`)
    candidatos.value = candidatos.value.filter(c => c.id !== cid)
    mostrarAlerta('Candidato excluído.')
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao excluir.', 'danger')
  }
}

function abrirModalEditarCandidato(c) {
  erroModal.value = ''
  candidatoEditando.value = c
  formEditarCandidato.value = { numero: c.numero, descricao: c.descricao }
  fotoEditarArquivo.value = null
  fotoEditarPreview.value = c.foto ? fotoUrl(c.foto) : ''
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

function confirmarExclusaoUrna(u) {
  abrirConfirmacao({
    titulo: 'Excluir urna',
    mensagem: `Tem certeza que deseja excluir "${u.descricao}"?`,
    acao: () => excluirUrna(u.id),
  })
}

async function excluirUrna(uid) {
  try {
    await api.delete(`/urnas/${uid}`)
    urnas.value = urnas.value.filter(u => u.id !== uid)
    mostrarAlerta('Urna excluída.')
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao excluir.', 'danger')
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
    mostrarAlerta('Eleitor inscrito.')
    fecharModalEleitor()
  } catch (err) {
    erroModal.value = err.response?.data?.message || 'Erro ao inscrever.'
  } finally {
    salvando.value = false
  }
}

function confirmarExclusaoEleitor(e) {
  abrirConfirmacao({
    titulo: 'Remover eleitor',
    mensagem: `Remover "${e.pessoa?.nome}" desta eleição?`,
    botao: 'Remover',
    acao: () => excluirEleitor(e.id),
  })
}

async function excluirEleitor(eid) {
  try {
    await api.delete(`/eleitores/${eid}`)
    eleitores.value = eleitores.value.filter(e => e.id !== eid)
    mostrarAlerta('Eleitor removido.')
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao remover.', 'danger')
  }
}

onMounted(async () => {
  bsModalEleicao = new Modal(modalEleicaoEl.value)
  bsModalCandidato = new Modal(modalCandidatoEl.value)
  bsModalEditarCandidato = new Modal(modalEditarCandidatoEl.value)
  bsModalUrna = new Modal(modalUrnaEl.value)
  bsModalEleitor = new Modal(modalEleitorEl.value)
  bsModalConfirmar = new Modal(modalConfirmarEl.value)

  try {
    const [resDetalhe, resEleitores, resPessoas] = await Promise.all([
      api.get(`/eleicoes/${id}`),
      api.get(`/eleitores?eleicao=${id}`),
      api.get('/pessoas'),
    ])

    eleicao.value = resDetalhe.data.data
    candidatos.value = resDetalhe.data.data.candidatos || []
    urnas.value = resDetalhe.data.data.urnas || []

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
        <p v-if="eleicao" class="text-muted small mb-0 mt-1">
          ID: <code>{{ eleicao.id }}</code>
          <button class="btn btn-link btn-sm p-0 ms-1 align-baseline" title="Copiar ID" @click="copiar(eleicao.id)">
            <i class="bi bi-copy"></i>
          </button>
        </p>
      </div>
      <div class="d-flex gap-2">
        <button
          v-if="eleicao?.status === 1"
          class="btn btn-sm btn-primary"
          @click="abrirModalEleicao"
        >
          <i class="bi bi-pencil me-1"></i>Editar
        </button>
        <button
          v-if="eleicao?.status === 1"
          class="btn btn-sm btn-success"
          @click="confirmarIniciar"
        >
          <i class="bi bi-play-fill me-1"></i>Iniciar eleição
        </button>
        <button
          v-else-if="eleicao?.status === 2"
          class="btn btn-sm btn-danger"
          @click="confirmarEncerrar"
        >
          <i class="bi bi-stop-fill me-1"></i>Encerrar eleição
        </button>
      </div>
    </div>

    <div v-if="alerta.mensagem" :class="['alert alert-dismissible fade show', `alert-${alerta.tipo}`]" role="alert">
      {{ alerta.mensagem }}
      <button type="button" class="btn-close" @click="alerta.mensagem = ''"></button>
    </div>

    <div v-if="eleicao && !editavel" class="alert alert-info small d-flex align-items-center gap-2">
      <i class="bi bi-lock-fill"></i>
      <span v-if="eleicao.status === 2">A eleição está em andamento. Candidatos, urnas e eleitores não podem mais ser alterados.</span>
      <span v-else>A eleição foi encerrada. Os dados estão disponíveis apenas para consulta.</span>
    </div>

    <!-- Skeleton de carregamento inicial -->
    <div v-if="loading">
      <div class="row g-3 mb-4">
        <div v-for="n in 3" :key="n" class="col-12 col-md-4">
          <div class="card border-0 shadow-sm placeholder-glow">
            <div class="card-body"><span class="placeholder col-8 rounded" style="height:48px"></span></div>
          </div>
        </div>
      </div>
    </div>

    <template v-else>
      <!-- Cards de totais -->
      <div class="row g-3 mb-4">
        <div class="col-12 col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <p class="text-muted small mb-1">Candidatos</p>
              <h3 class="fw-bold mb-0">{{ candidatos.length }}</h3>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <p class="text-muted small mb-1">Urnas</p>
              <h3 class="fw-bold mb-0">{{ urnas.length }}</h3>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <p class="text-muted small mb-1">Eleitores</p>
              <h3 class="fw-bold mb-0">{{ eleitores.length }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Candidatos + Urnas -->
      <div class="row g-3 mb-3">
        <!-- Candidatos -->
        <div class="col-12 col-xl-7">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-0 d-flex align-items-center justify-content-between py-3">
              <h6 class="fw-bold mb-0"><i class="bi bi-person-badge-fill text-primary me-2"></i>Candidatos</h6>
              <button v-if="editavel" class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" @click="abrirModalCandidato()">
                <i class="bi bi-plus-lg"></i> Candidato
              </button>
            </div>
            <div class="card-body p-3">
              <div class="alert alert-light border small py-2 mb-3 d-flex gap-2">
                <i class="bi bi-info-circle text-primary"></i>
                <span>
                  Votos em <strong>branco</strong> e <strong>nulos</strong> são contabilizados automaticamente pela urna:
                  branco pela tecla BRANCO e nulo quando o número digitado não corresponde a nenhum candidato.
                  Não é preciso cadastrá-los.
                </span>
              </div>
              <div v-if="candidatos.length === 0" class="text-center py-4 text-muted">
                <i class="bi bi-person-badge fs-2 d-block mb-2"></i>
                Nenhum candidato cadastrado
              </div>
              <div v-else class="candidatos-lista">
                <div v-for="c in candidatosOrdenados" :key="c.id" class="candidato-item">
                  <div class="candidato-item__foto">
                    <img v-if="c.foto" :src="fotoUrl(c.foto)" :alt="c.descricao" />
                    <div v-else class="candidato-item__foto-empty"><i class="bi bi-person-fill"></i></div>
                  </div>
                  <div class="candidato-item__info d-flex align-items-center justify-content-between gap-2">
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                      <span class="badge bg-secondary-subtle text-secondary fw-bold px-2">Nº {{ c.numero }}</span>
                      <span class="fw-semibold">{{ c.descricao }}</span>
                    </div>
                    <div v-if="editavel" class="d-flex gap-1">
                      <button class="btn btn-sm btn-light border px-2 py-1" @click="abrirModalEditarCandidato(c)" title="Editar">
                        <i class="bi bi-pencil small text-primary"></i>
                      </button>
                      <button class="btn btn-sm btn-light border px-2 py-1" @click="confirmarExclusaoCandidato(c)" title="Excluir">
                        <i class="bi bi-trash small text-danger"></i>
                      </button>
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
              <button v-if="editavel" class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" @click="abrirModalUrna()">
                <i class="bi bi-plus-lg"></i> Urna
              </button>
            </div>
            <div class="card-body p-0">
              <div v-if="urnas.length === 0" class="text-center py-4 text-muted">
                <i class="bi bi-archive fs-2 d-block mb-2"></i>
                Nenhuma urna cadastrada
              </div>
              <ul v-else class="list-group list-group-flush">
                <li v-for="u in urnas" :key="u.id" class="list-group-item d-flex align-items-center justify-content-between gap-2 py-3">
                  <div class="text-truncate">
                    <p class="fw-semibold small mb-0">{{ u.descricao }}</p>
                    <span class="text-muted small">
                      ID: <code>{{ u.id }}</code>
                      <button class="btn btn-link btn-sm p-0 ms-1 align-baseline" title="Copiar ID" @click="copiar(u.id)">
                        <i class="bi bi-copy"></i>
                      </button>
                    </span>
                  </div>
                  <button v-if="editavel" class="btn btn-sm btn-link text-danger p-0" title="Excluir" @click="confirmarExclusaoUrna(u)">
                    <i class="bi bi-trash small"></i>
                  </button>
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
            <button v-if="editavel" class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" @click="abrirModalEleitor()">
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
                  <th v-if="!editavel" class="small fw-semibold pe-4">Situação</th>
                  <th v-else class="small fw-semibold text-end pe-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="e in eleitoresFiltrados" :key="e.id">
                  <td class="ps-4 fw-semibold small">{{ e.pessoa?.nome || '—' }}</td>
                  <td class="small text-muted">{{ e.pessoa?.matricula || '—' }}</td>
                  <td class="small text-muted">{{ e.pessoa?.curso || '—' }}</td>
                  <td v-if="!editavel" class="pe-4">
                    <span :class="['badge rounded-pill',
                      e.status === 2 ? 'bg-success-subtle text-success' :
                      e.status === 3 ? 'bg-danger-subtle text-danger' :
                      'bg-secondary-subtle text-secondary'
                    ]">
                      {{ e.status === 2 ? 'Votou' : e.status === 3 ? 'Faltou' : 'Aguardando' }}
                    </span>
                  </td>
                  <td v-else class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-danger" title="Remover" @click="confirmarExclusaoEleitor(e)">
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
                <div class="form-text">Brancos e nulos são automáticos — não cadastre candidatos para eles.</div>
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

    <!-- Modal Confirmação -->
    <div class="modal fade" tabindex="-1" ref="modalConfirmarEl">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <h6 class="modal-title fw-bold">{{ confirmarConfig.titulo }}</h6>
            <button type="button" class="btn-close" @click="fecharModalConfirmar"></button>
          </div>
          <div class="modal-body pt-2">
            <p class="small mb-0">{{ confirmarConfig.mensagem }}</p>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary btn-sm" @click="fecharModalConfirmar">Cancelar</button>
            <button type="button" :class="['btn btn-sm d-flex align-items-center gap-2', confirmarConfig.classe]" @click="executarConfirmacao" :disabled="confirmando">
              <span v-if="confirmando" class="spinner-border spinner-border-sm"></span>
              {{ confirmarConfig.botao }}
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
}

.candidato-item__foto {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
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

.candidato-item__foto-empty {
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: #adb5bd;
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
