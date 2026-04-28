<template>
  <div>
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h5 class="fw-bold mb-0">Urnas</h5>
        <p class="text-muted small mb-0">Gerencie as urnas eletrônicas</p>
      </div>
      <button class="btn btn-primary d-flex align-items-center gap-2">
        <i class="bi bi-plus-lg"></i> Nova Urna
      </button>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        <div v-if="loading" class="p-4">
          <div v-for="n in 3" :key="n" class="placeholder-glow mb-3">
            <span class="placeholder col-12 rounded" style="height:36px"></span>
          </div>
        </div>
        <div v-else-if="lista.length === 0" class="text-center py-5 text-muted">
          <i class="bi bi-inbox fs-2 d-block mb-2"></i>
          Nenhuma urna cadastrada
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
              <tr v-for="item in lista" :key="item.id">
                <td class="ps-4 fw-semibold small">{{ item.descricao }}</td>
                <td class="small text-muted">{{ item.eleicao?.descricao || '—' }}</td>
                <td>
                  <span :class="['badge rounded-pill', item.status === 1 ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary']">
                    {{ item.status === 1 ? 'Ativa' : 'Inativa' }}
                  </span>
                </td>
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
import { ref, onMounted } from 'vue'
import api from '../../services/api.js'

const lista = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await api.get('/urnas')
    lista.value = data.data || []
  } finally {
    loading.value = false
  }
})
</script>
