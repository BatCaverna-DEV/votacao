<template>
  <div>
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h5 class="fw-bold mb-0">Eleitores</h5>
        <p class="text-muted small mb-0">Gerencie os eleitores por eleição</p>
      </div>
      <button class="btn btn-primary d-flex align-items-center gap-2" @click="abrirModal()">
        <i class="bi bi-plus-lg"></i> Inscrever Eleitor
      </button>
    </div>

    <div v-if="alerta.mensagem" :class="['alert alert-dismissible fade show', `alert-${alerta.tipo}`]" role="alert">
      {{ alerta.mensagem }}
      <button type="button" class="btn-close" @click="alerta.mensagem = ''"></button>
    </div>

    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body py-2">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-md-5">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light border-end-0"><i class="bi bi-search text-muted"></i></span>
              <input v-model="busca" type="text" class="form-control border-start-0" placeholder="Buscar por nome..." />
            </div>
          </div>
          <div class="col-auto">
            <select v-model="filtroEleicao" class="form-select form-select-sm">
              <option value="">Todas as eleições</option>
              <option v-for="e in eleicoes" :key="e.id" :value="e.id">{{ e.descricao }}</option>
            </select>
          </div>
          <div class="col-auto">
            <select v-model="filtroSituacao" class="form-select form-select-sm">
              <option value="">Todas as situações</option>
              <option value="0">Pendente</option>
              <option value="1">Liberado</option>
              <option value="2">Votou</option>
              <option value="3">Faltou</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        <div v-if="loading" class="p-4">
          <div v-for="n in 4" :key="n" class="placeholder-glow mb-3">
            <span class="placeholder col-12 rounded" style="height:36px"></span>
          </div>
        </div>
        <div v-else-if="listaFiltrada.length === 0" class="text-center py-5 text-muted">
          <i class="bi bi-inbox fs-2 d-block mb-2"></i>
          Nenhum eleitor encontrado
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="small fw-semibold ps-4">Nome</th>
                <th class="small fw-semibold">Matrícula</th>
                <th class="small fw-semibold">Eleição</th>
                <th class="small fw-semibold">Situação</th>
                <th class="small fw-semibold text-end pe-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in listaFiltrada" :key="item.id">
                <td class="ps-4 fw-semibold small">{{ item.pessoa?.nome || '—' }}</td>
                <td class="small text-muted">{{ item.pessoa?.matricula || '—' }}</td>
                <td class="small text-muted">{{ item.eleicao?.descricao || '—' }}</td>
                <td>
                  <span :class="['badge rounded-pill',
                    item.status === 2 ? 'bg-success-subtle text-success' :
                    item.status === 1 ? 'bg-primary-subtle text-primary' :
                    item.status === 3 ? 'bg-danger-subtle text-danger' :
                    'bg-warning-subtle text-warning'
                  ]">
                    {{ item.status === 2 ? 'Votou' : item.status === 1 ? 'Liberado' : item.status === 3 ? 'Faltou' : 'Pendente' }}
                  </span>
                </td>
                <td class="text-end pe-4">
                  <button class="btn btn-sm btn-outline-danger" title="Remover" @click="confirmarExclusao(item)" :disabled="item.status === 2">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Inscrever -->
    <div class="modal fade" tabindex="-1" ref="modalEl">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Inscrever Eleitor</h5>
            <button type="button" class="btn-close" @click="fecharModal"></button>
          </div>
          <form @submit.prevent="salvar">
            <div class="modal-body">
              <div v-if="erroModal" class="alert alert-danger py-2 small">{{ erroModal }}</div>

              <div class="mb-3">
                <label class="form-label small fw-semibold">Eleição <span class="text-danger">*</span></label>
                <select v-model="form.eleicoes_id" class="form-select" required>
                  <option value="">Selecione uma eleição</option>
                  <option v-for="e in eleicoes" :key="e.id" :value="e.id">{{ e.descricao }}</option>
                </select>
              </div>

              <div class="mb-1">
                <label class="form-label small fw-semibold">Pessoa <span class="text-danger">*</span></label>
                <select v-model="form.pessoas_id" class="form-select" required>
                  <option value="">Selecione uma pessoa</option>
                  <option v-for="p in pessoas" :key="p.id" :value="p.id">{{ p.nome }} {{ p.matricula ? `(${p.matricula})` : '' }}</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="fecharModal">Cancelar</button>
              <button type="submit" class="btn btn-primary d-flex align-items-center gap-2" :disabled="salvando">
                <span v-if="salvando" class="spinner-border spinner-border-sm"></span>
                Inscrever
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Excluir -->
    <div class="modal fade" tabindex="-1" ref="modalExcluirEl">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <h6 class="modal-title fw-bold">Remover eleitor</h6>
            <button type="button" class="btn-close" @click="fecharModalExcluir"></button>
          </div>
          <div class="modal-body pt-2">
            <p class="small mb-0">Remover <strong>{{ itemParaExcluir?.pessoa?.nome }}</strong> da eleição <strong>{{ itemParaExcluir?.eleicao?.descricao }}</strong>?</p>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary btn-sm" @click="fecharModalExcluir">Cancelar</button>
            <button type="button" class="btn btn-danger btn-sm d-flex align-items-center gap-2" @click="excluir" :disabled="excluindo">
              <span v-if="excluindo" class="spinner-border spinner-border-sm"></span>
              Remover
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Modal } from 'bootstrap'
import api from '../../services/api.js'

const lista = ref([])
const eleicoes = ref([])
const pessoas = ref([])
const loading = ref(true)
const busca = ref('')
const filtroEleicao = ref('')
const filtroSituacao = ref('')
const alerta = ref({ mensagem: '', tipo: 'success' })

const modalEl = ref(null)
const modalExcluirEl = ref(null)
let bsModal = null
let bsModalExcluir = null

const salvando = ref(false)
const erroModal = ref('')
const form = ref({ pessoas_id: '', eleicoes_id: '' })

const itemParaExcluir = ref(null)
const excluindo = ref(false)

const listaFiltrada = computed(() =>
  lista.value.filter(e => {
    const matchBusca = !busca.value || e.pessoa?.nome?.toLowerCase().includes(busca.value.toLowerCase())
    const matchEleicao = !filtroEleicao.value || e.eleicoes_id === filtroEleicao.value
    const matchSituacao = filtroSituacao.value === '' || String(e.status) === filtroSituacao.value
    return matchBusca && matchEleicao && matchSituacao
  })
)

function abrirModal() {
  erroModal.value = ''
  form.value = { pessoas_id: '', eleicoes_id: '' }
  bsModal.show()
}

function fecharModal() { bsModal.hide() }

async function salvar() {
  erroModal.value = ''
  salvando.value = true
  try {
    const { data } = await api.post('/eleitores', form.value)
    const detalhe = await api.get(`/eleitores/${data.data.id}`)
    lista.value.unshift(detalhe.data.data)
    mostrarAlerta('Eleitor inscrito com sucesso.', 'success')
    fecharModal()
  } catch (err) {
    erroModal.value = err.response?.data?.message || 'Ocorreu um erro. Tente novamente.'
  } finally {
    salvando.value = false
  }
}

function confirmarExclusao(item) {
  itemParaExcluir.value = item
  bsModalExcluir.show()
}

function fecharModalExcluir() { bsModalExcluir.hide() }

async function excluir() {
  excluindo.value = true
  try {
    await api.delete(`/eleitores/${itemParaExcluir.value.id}`)
    lista.value = lista.value.filter(e => e.id !== itemParaExcluir.value.id)
    mostrarAlerta('Eleitor removido com sucesso.', 'success')
    fecharModalExcluir()
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao remover eleitor.', 'danger')
    fecharModalExcluir()
  } finally {
    excluindo.value = false
  }
}

function mostrarAlerta(mensagem, tipo) {
  alerta.value = { mensagem, tipo }
  setTimeout(() => { alerta.value.mensagem = '' }, 4000)
}

onMounted(async () => {
  bsModal = new Modal(modalEl.value)
  bsModalExcluir = new Modal(modalExcluirEl.value)
  try {
    const [resEleitores, resEleicoes, resPessoas] = await Promise.all([
      api.get('/eleitores'),
      api.get('/eleicoes'),
      api.get('/pessoas'),
    ])
    lista.value = resEleitores.data.data || []
    eleicoes.value = resEleicoes.data.data || []
    pessoas.value = resPessoas.data.data || []
  } finally {
    loading.value = false
  }
})
</script>
