<template>
  <div>
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h5 class="fw-bold mb-0">Usuários</h5>
        <p class="text-muted small mb-0">Gerencie os usuários do sistema</p>
      </div>
      <button class="btn btn-primary d-flex align-items-center gap-2">
        <i class="bi bi-plus-lg"></i> Novo Usuário
      </button>
    </div>

    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body py-2">
        <div class="input-group input-group-sm" style="max-width: 360px">
          <span class="input-group-text bg-light border-end-0"><i class="bi bi-search text-muted"></i></span>
          <input v-model="busca" type="text" class="form-control border-start-0" placeholder="Buscar usuário..." />
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
          Nenhum usuário encontrado
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="small fw-semibold ps-4">Username</th>
                <th class="small fw-semibold">Categoria</th>
                <th class="small fw-semibold text-end pe-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in listaFiltrada" :key="item.id">
                <td class="ps-4">
                  <div class="d-flex align-items-center gap-2">
                    <div class="avatar-sm">{{ item.username?.slice(0, 2).toUpperCase() }}</div>
                    <span class="fw-semibold small">{{ item.username }}</span>
                  </div>
                </td>
                <td>
                  <span :class="['badge rounded-pill', item.categoria === 1 ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary']">
                    {{ item.categoria === 1 ? 'Admin' : 'Eleitor' }}
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
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api.js'

const lista = ref([])
const loading = ref(true)
const busca = ref('')

const listaFiltrada = computed(() =>
  lista.value.filter(u => !busca.value || u.username?.toLowerCase().includes(busca.value.toLowerCase()))
)

onMounted(async () => {
  try {
    const { data } = await api.get('/usuarios')
    lista.value = data.data || []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.avatar-sm {
  width: 30px;
  height: 30px;
  background: #0d6efd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}
</style>
