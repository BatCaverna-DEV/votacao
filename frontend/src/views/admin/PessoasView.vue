<template>
  <div>
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h5 class="fw-bold mb-0">Pessoas</h5>
        <p class="text-muted small mb-0">Gerencie o cadastro de pessoas</p>
      </div>
      <button class="btn btn-primary d-flex align-items-center gap-2">
        <i class="bi bi-plus-lg"></i> Nova Pessoa
      </button>
    </div>

    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body py-2">
        <div class="input-group input-group-sm" style="max-width: 360px">
          <span class="input-group-text bg-light border-end-0"><i class="bi bi-search text-muted"></i></span>
          <input v-model="busca" type="text" class="form-control border-start-0" placeholder="Buscar por nome ou matrícula..." />
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
          Nenhuma pessoa encontrada
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="small fw-semibold ps-4">Nome</th>
                <th class="small fw-semibold">Matrícula</th>
                <th class="small fw-semibold">Email</th>
                <th class="small fw-semibold">Curso</th>
                <th class="small fw-semibold text-end pe-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in listaFiltrada" :key="item.id">
                <td class="ps-4 fw-semibold small">{{ item.nome || '—' }}</td>
                <td class="small text-muted">{{ item.matricula || '—' }}</td>
                <td class="small text-muted">{{ item.email || '—' }}</td>
                <td class="small text-muted">{{ item.curso || '—' }}</td>
                <td class="text-end pe-4">
                  <button class="btn btn-sm btn-outline-secondary me-1"><i class="bi bi-pencil"></i></button>
                  <button class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button>
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

const listaFiltrada = computed(() =>
  lista.value.filter(p =>
    !busca.value ||
    p.nome?.toLowerCase().includes(busca.value.toLowerCase()) ||
    p.matricula?.toLowerCase().includes(busca.value.toLowerCase())
  )
)

onMounted(async () => {
  try {
    const { data } = await api.get('/pessoas')
    lista.value = data.data || []
  } finally {
    loading.value = false
  }
})
</script>
