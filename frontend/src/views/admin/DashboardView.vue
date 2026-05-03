<template>
  <div>
    <!-- Cabeçalho da página -->
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h5 class="fw-bold mb-0">Dashboard</h5>
        <p class="text-muted small mb-0">Bem-vindo, {{ auth.usuario?.username }}! Aqui está o resumo do sistema.</p>
      </div>
      <span class="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill small">
        <i class="bi bi-calendar3 me-1"></i>{{ dataHoje }}
      </span>
    </div>

    <!-- Cards de estatísticas -->
    <div class="row g-3 mb-4">
      <div v-for="card in cards" :key="card.label" class="col-12 col-sm-6 col-xl-3">
        <div class="stat-card card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex align-items-start justify-content-between">
              <div>
                <p class="text-muted small mb-1">{{ card.label }}</p>
                <h3 class="fw-bold mb-0">
                  <span v-if="loading" class="placeholder col-4 rounded"></span>
                  <span v-else>{{ card.valor }}</span>
                </h3>
              </div>
              <div :class="['stat-icon', `stat-icon--${card.cor}`]">
                <i :class="['bi', card.icon]"></i>
              </div>
            </div>
            <RouterLink :to="card.to" class="stat-link small mt-3 d-inline-flex align-items-center gap-1">
              Ver detalhes <i class="bi bi-arrow-right"></i>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Alerta de erro -->
    <div v-if="erroCarregamento" class="alert alert-warning d-flex align-items-center mt-3" role="alert">
      <i class="bi bi-exclamation-triangle me-2"></i>
      <span class="small">{{ erroCarregamento }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useAuthStore } from '../../stores/auth.js'
import api from '../../services/api.js'

const auth = useAuthStore()
const loading = ref(true)
const erroCarregamento = ref(null)

const totais = reactive({ eleicoes: 0, candidatos: 0, eleitores: 0, usuarios: 0 })

const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const cards = computed(() => [
  { label: 'Eleições',   valor: totais.eleicoes,   icon: 'bi-ballot',       cor: 'blue',   to: '/eleicoes'  },
  { label: 'Candidatos', valor: totais.candidatos, icon: 'bi-person-badge', cor: 'green',  to: '/candidatos' },
  { label: 'Eleitores',  valor: totais.eleitores,  icon: 'bi-people',       cor: 'orange', to: '/eleitores' },
  { label: 'Usuários',   valor: totais.usuarios,   icon: 'bi-person-gear',  cor: 'purple', to: '/usuarios'  },
])

onMounted(async () => {
  try {
    const [resEleicoes, resCandidatos, resEleitores, resUsuarios] = await Promise.all([
      api.get('/eleicoes'),
      api.get('/candidatos'),
      api.get('/eleitores'),
      api.get('/usuarios'),
    ])
    totais.eleicoes   = (resEleicoes.data.data || []).length
    totais.candidatos = (resCandidatos.data.data || []).length
    totais.eleitores  = (resEleitores.data.data || []).length
    totais.usuarios   = (resUsuarios.data.data || []).length
  } catch (e) {
    erroCarregamento.value = 'Não foi possível carregar todos os dados. Verifique se a API está rodando.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.stat-card {
  border-radius: 12px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.1) !important;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.stat-icon--blue   { background: #dbeafe; color: #1d4ed8; }
.stat-icon--green  { background: #dcfce7; color: #15803d; }
.stat-icon--orange { background: #ffedd5; color: #c2410c; }
.stat-icon--purple { background: #ede9fe; color: #7c3aed; }

.stat-link {
  color: #6c757d;
  text-decoration: none;
  transition: color 0.15s;
}

.stat-link:hover {
  color: #0d6efd;
}

.card-header {
  border-bottom: 1px solid #f0f0f0 !important;
}
</style>
