<template>
  <div>
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h5 class="fw-bold mb-0">Urnas</h5>
        <p class="text-muted small mb-0">Gerencie as urnas eletrônicas</p>
      </div>
      <button class="btn btn-primary d-flex align-items-center gap-2" @click="abrirModal()">
        <i class="bi bi-plus-lg"></i> Nova Urna
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
              <input v-model="busca" type="text" class="form-control border-start-0" placeholder="Buscar urna..." />
            </div>
          </div>
          <div class="col-auto">
            <select v-model="filtroEleicao" class="form-select form-select-sm">
              <option value="">Todas as eleições</option>
              <option v-for="e in eleicoes" :key="e.id" :value="e.id">{{ e.descricao }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        <div v-if="loading" class="p-4">
          <div v-for="n in 3" :key="n" class="placeholder-glow mb-3">
            <span class="placeholder col-12 rounded" style="height:36px"></span>
          </div>
        </div>
        <div v-else-if="listaFiltrada.length === 0" class="text-center py-5 text-muted">
          <i class="bi bi-inbox fs-2 d-block mb-2"></i>
          Nenhuma urna encontrada
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="small fw-semibold ps-4">Descrição</th>
                <th class="small fw-semibold">Eleição</th>
                <th class="small fw-semibold">Status</th>
                <th class="small fw-semibold text-end pe-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in listaFiltrada" :key="item.id">
                <td class="ps-4 fw-semibold small">{{ item.descricao }}</td>
                <td class="small text-muted">{{ item.eleicao?.descricao || '—' }}</td>
                <td>
                  <span :class="['badge rounded-pill', badgeUrnaStatus(item.status)]">
                    {{ labelUrnaStatus(item.status) }}
                  </span>
                </td>
                <td class="text-end pe-4">
                  <button class="btn btn-sm btn-outline-secondary me-1" title="Editar" @click="abrirModal(item)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" title="Excluir" @click="confirmarExclusao(item)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Criar / Editar -->
    <div class="modal fade" tabindex="-1" ref="modalEl">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ modoEdicao ? 'Editar Urna' : 'Nova Urna' }}</h5>
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

              <div class="mb-3">
                <label class="form-label small fw-semibold">Descrição <span class="text-danger">*</span></label>
                <input v-model="form.descricao" type="text" class="form-control" maxlength="100" required />
              </div>

              <div v-if="modoEdicao" class="mb-1">
                <label class="form-label small fw-semibold">Status</label>
                <select v-model="form.status" class="form-select">
                  <option :value="1">Fechada</option>
                  <option :value="2">Aberta</option>
                  <option :value="3">Apurada</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="fecharModal">Cancelar</button>
              <button type="submit" class="btn btn-primary d-flex align-items-center gap-2" :disabled="salvando">
                <span v-if="salvando" class="spinner-border spinner-border-sm"></span>
                {{ modoEdicao ? 'Salvar alterações' : 'Criar urna' }}
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
            <h6 class="modal-title fw-bold">Excluir urna</h6>
            <button type="button" class="btn-close" @click="fecharModalExcluir"></button>
          </div>
          <div class="modal-body pt-2">
            <p class="small mb-0">Tem certeza que deseja excluir <strong>{{ itemParaExcluir?.descricao }}</strong>? Esta ação não pode ser desfeita.</p>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary btn-sm" @click="fecharModalExcluir">Cancelar</button>
            <button type="button" class="btn btn-danger btn-sm d-flex align-items-center gap-2" @click="excluir" :disabled="excluindo">
              <span v-if="excluindo" class="spinner-border spinner-border-sm"></span>
              Excluir
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
const loading = ref(true)
const busca = ref('')
const filtroEleicao = ref('')
const alerta = ref({ mensagem: '', tipo: 'success' })

const modalEl = ref(null)
const modalExcluirEl = ref(null)
let bsModal = null
let bsModalExcluir = null

const modoEdicao = ref(false)
const salvando = ref(false)
const erroModal = ref('')
const form = ref({ id: null, descricao: '', eleicoes_id: '', status: 0 })

const itemParaExcluir = ref(null)
const excluindo = ref(false)

const listaFiltrada = computed(() =>
  lista.value.filter(u => {
    const matchBusca = !busca.value || u.descricao?.toLowerCase().includes(busca.value.toLowerCase())
    const matchEleicao = !filtroEleicao.value || u.eleicoes_id === filtroEleicao.value
    return matchBusca && matchEleicao
  })
)

function badgeUrnaStatus(s) {
  return { 1: 'bg-secondary-subtle text-secondary', 2: 'bg-success-subtle text-success', 3: 'bg-info-subtle text-info' }[s] ?? 'bg-secondary-subtle text-secondary'
}

function labelUrnaStatus(s) {
  return { 1: 'Fechada', 2: 'Aberta', 3: 'Apurada' }[s] ?? '—'
}

function abrirModal(item = null) {
  erroModal.value = ''
  if (item) {
    modoEdicao.value = true
    form.value = { id: item.id, descricao: item.descricao, eleicoes_id: item.eleicoes_id, status: item.status ?? 0 }
  } else {
    modoEdicao.value = false
    form.value = { id: null, descricao: '', eleicoes_id: '', status: 0 }
  }
  bsModal.show()
}

function fecharModal() { bsModal.hide() }

async function salvar() {
  erroModal.value = ''
  salvando.value = true
  try {
    const payload = { descricao: form.value.descricao, eleicoes_id: form.value.eleicoes_id, status: form.value.status }
    if (modoEdicao.value) {
      const { data } = await api.put(`/urnas/${form.value.id}`, payload)
      const idx = lista.value.findIndex(u => u.id === form.value.id)
      if (idx !== -1) lista.value[idx] = { ...lista.value[idx], ...data.data }
      mostrarAlerta('Urna atualizada com sucesso.', 'success')
    } else {
      const { data } = await api.post('/urnas', payload)
      const detalhe = await api.get(`/urnas/${data.data.id}`)
      lista.value.unshift(detalhe.data.data)
      mostrarAlerta('Urna criada com sucesso.', 'success')
    }
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
    await api.delete(`/urnas/${itemParaExcluir.value.id}`)
    lista.value = lista.value.filter(u => u.id !== itemParaExcluir.value.id)
    mostrarAlerta('Urna excluída com sucesso.', 'success')
    fecharModalExcluir()
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao excluir urna.', 'danger')
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
    const [resUrnas, resEleicoes] = await Promise.all([
      api.get('/urnas'),
      api.get('/eleicoes'),
    ])
    lista.value = resUrnas.data.data || []
    eleicoes.value = resEleicoes.data.data || []
  } finally {
    loading.value = false
  }
})
</script>
