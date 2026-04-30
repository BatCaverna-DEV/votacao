<template>
  <div>
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h5 class="fw-bold mb-0">Eleições</h5>
        <p class="text-muted small mb-0">Gerencie as eleições do sistema</p>
      </div>
      <button class="btn btn-primary d-flex align-items-center gap-2" @click="abrirModal()">
        <i class="bi bi-plus-lg"></i> Nova Eleição
      </button>
    </div>

    <!-- Alerta de feedback -->
    <div v-if="alerta.mensagem" :class="['alert alert-dismissible fade show', `alert-${alerta.tipo}`]" role="alert">
      {{ alerta.mensagem }}
      <button type="button" class="btn-close" @click="alerta.mensagem = ''"></button>
    </div>

    <!-- Filtros -->
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body py-2">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-md-5">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light border-end-0">
                <i class="bi bi-search text-muted"></i>
              </span>
              <input v-model="busca" type="text" class="form-control border-start-0" placeholder="Buscar eleição..." />
            </div>
          </div>
          <div class="col-auto">
            <select v-model="filtroStatus" class="form-select form-select-sm">
              <option value="">Todos os status</option>
              <option value="1">Criada</option>
              <option value="2">Em Andamento</option>
              <option value="3">Em Apuração</option>
              <option value="4">Finalizada</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabela -->
    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        <div v-if="loading" class="p-4">
          <div v-for="n in 4" :key="n" class="placeholder-glow mb-3">
            <span class="placeholder col-12 rounded" style="height:36px"></span>
          </div>
        </div>
        <div v-else-if="listaFiltrada.length === 0" class="text-center py-5 text-muted">
          <i class="bi bi-inbox fs-2 d-block mb-2"></i>
          Nenhuma eleição encontrada
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="small fw-semibold ps-4">Descrição</th>
                <th class="small fw-semibold">Início</th>
                <th class="small fw-semibold">Fim</th>
                <th class="small fw-semibold">Status</th>
                <th class="small fw-semibold text-end pe-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in listaFiltrada" :key="item.id" class="row-clicavel" @click="$router.push(`/eleicoes/${item.id}`)">
                <td class="ps-4 fw-semibold small">{{ item.descricao }}</td>
                <td class="small text-muted">{{ formatarData(item.inicio) }}</td>
                <td class="small text-muted">{{ formatarData(item.fim) }}</td>
                <td>
                  <span :class="['badge rounded-pill', badgeStatus(item.status)]">
                    {{ labelStatus(item.status) }}
                  </span>
                </td>
                <td class="text-end pe-4" @click.stop>
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
    <div class="modal fade" id="modalEleicao" tabindex="-1" ref="modalEl">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ modoEdicao ? 'Editar Eleição' : 'Nova Eleição' }}</h5>
            <button type="button" class="btn-close" @click="fecharModal"></button>
          </div>
          <form @submit.prevent="salvar">
            <div class="modal-body">
              <div v-if="erroModal" class="alert alert-danger py-2 small">{{ erroModal }}</div>

              <div class="mb-3">
                <label class="form-label small fw-semibold">Descrição <span class="text-danger">*</span></label>
                <input v-model="form.descricao" type="text" class="form-control" maxlength="100" required />
              </div>

              <div class="row g-3 mb-3">
                <div class="col-6">
                  <label class="form-label small fw-semibold">Data de Início</label>
                  <input v-model="form.inicio" type="date" class="form-control" />
                </div>
                <div class="col-6">
                  <label class="form-label small fw-semibold">Data de Fim</label>
                  <input v-model="form.fim" type="date" class="form-control" />
                </div>
              </div>

              <div v-if="modoEdicao" class="mb-1">
                <label class="form-label small fw-semibold">Status</label>
                <select v-model="form.status" class="form-select">
                  <option :value="1">Criada</option>
                  <option :value="2">Em Andamento</option>
                  <option :value="3">Em Apuração</option>
                  <option :value="4">Finalizada</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="fecharModal">Cancelar</button>
              <button type="submit" class="btn btn-primary d-flex align-items-center gap-2" :disabled="salvando">
                <span v-if="salvando" class="spinner-border spinner-border-sm"></span>
                {{ modoEdicao ? 'Salvar alterações' : 'Criar eleição' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Confirmar Exclusão -->
    <div class="modal fade" id="modalExcluir" tabindex="-1" ref="modalExcluirEl">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <h6 class="modal-title fw-bold">Excluir eleição</h6>
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
const loading = ref(true)
const busca = ref('')
const filtroStatus = ref('')
const alerta = ref({ mensagem: '', tipo: 'success' })

const modalEl = ref(null)
const modalExcluirEl = ref(null)
let bsModal = null
let bsModalExcluir = null

const modoEdicao = ref(false)
const salvando = ref(false)
const erroModal = ref('')
const form = ref({ id: null, descricao: '', inicio: '', fim: '', status: 0 })

const itemParaExcluir = ref(null)
const excluindo = ref(false)

const listaFiltrada = computed(() =>
  lista.value.filter(e => {
    const matchBusca = !busca.value || e.descricao?.toLowerCase().includes(busca.value.toLowerCase())
    const matchStatus = filtroStatus.value === '' || String(e.status) === filtroStatus.value
    return matchBusca && matchStatus
  })
)

function formatarData(data) {
  if (!data) return '—'
  return new Date(data).toLocaleDateString('pt-BR')
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

function dataParaInput(valor) {
  if (!valor) return ''
  return new Date(valor).toISOString().slice(0, 10)
}

function abrirModal(item = null) {
  erroModal.value = ''
  if (item) {
    modoEdicao.value = true
    form.value = { id: item.id, descricao: item.descricao, inicio: dataParaInput(item.inicio), fim: dataParaInput(item.fim), status: item.status ?? 0 }
  } else {
    modoEdicao.value = false
    form.value = { id: null, descricao: '', inicio: '', fim: '', status: 1 }
  }
  bsModal.show()
}

function fecharModal() {
  bsModal.hide()
}

async function salvar() {
  erroModal.value = ''
  salvando.value = true
  try {
    const payload = {
      descricao: form.value.descricao,
      inicio: form.value.inicio || null,
      fim: form.value.fim || null,
      status: form.value.status,
    }
    if (modoEdicao.value) {
      const { data } = await api.put(`/eleicoes/${form.value.id}`, payload)
      const idx = lista.value.findIndex(e => e.id === form.value.id)
      if (idx !== -1) lista.value[idx] = data.data
      mostrarAlerta('Eleição atualizada com sucesso.', 'success')
    } else {
      const { data } = await api.post('/eleicoes', payload)
      lista.value.unshift(data.data)
      mostrarAlerta('Eleição criada com sucesso.', 'success')
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

function fecharModalExcluir() {
  bsModalExcluir.hide()
}

async function excluir() {
  excluindo.value = true
  try {
    await api.delete(`/eleicoes/${itemParaExcluir.value.id}`)
    lista.value = lista.value.filter(e => e.id !== itemParaExcluir.value.id)
    mostrarAlerta('Eleição excluída com sucesso.', 'success')
    fecharModalExcluir()
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao excluir eleição.', 'danger')
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
    const { data } = await api.get('/eleicoes')
    lista.value = data.data || []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.row-clicavel {
  cursor: pointer;
}
</style>
