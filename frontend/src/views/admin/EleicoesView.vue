<template>
  <div>
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h5 class="fw-bold mb-0">Eleições</h5>
        <p class="text-muted small mb-0">Gerencie as eleições do sistema</p>
      </div>
      <button class="btn btn-primary d-flex align-items-center gap-2">
        <i class="bi bi-plus-lg"></i> Nova Eleição
      </button>
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
              <option value="0">Inativa</option>
              <option value="1">Ativa</option>
              <option value="2">Encerrada</option>
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
        <div v-else-if="lista.length === 0" class="text-center py-5 text-muted">
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
              <tr v-for="item in listaFiltrada" :key="item.id">
                <td class="ps-4 fw-semibold small">{{ item.descricao }}</td>
                <td class="small text-muted">{{ formatarData(item.inicio) }}</td>
                <td class="small text-muted">{{ formatarData(item.fim) }}</td>
                <td>
                  <span :class="['badge rounded-pill', badgeStatus(item.status)]">
                    {{ labelStatus(item.status) }}
                  </span>
                </td>
                <td class="text-end pe-4">
                  <button class="btn btn-sm btn-outline-secondary me-1" title="Editar">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" title="Excluir">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api.js'

const lista = ref([])
const loading = ref(true)
const busca = ref('')
const filtroStatus = ref('')

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
  return { 0: 'bg-secondary-subtle text-secondary', 1: 'bg-success-subtle text-success', 2: 'bg-danger-subtle text-danger' }[s] ?? 'bg-secondary-subtle text-secondary'
}

function labelStatus(s) {
  return { 0: 'Inativa', 1: 'Ativa', 2: 'Encerrada' }[s] ?? '—'
}

onMounted(async () => {
  try {
    const { data } = await api.get('/eleicoes')
    lista.value = data.data || []
  } finally {
    loading.value = false
  }
})
</script>
