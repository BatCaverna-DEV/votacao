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

    <!-- Linha com tabela de eleições e atividade recente -->
    <div class="row g-3">
      <!-- Tabela de Eleições -->
      <div class="col-12 col-xl-8">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-0 d-flex align-items-center justify-content-between py-3">
            <h6 class="fw-bold mb-0">
              <i class="bi bi-ballot text-primary me-2"></i>Eleições
            </h6>
            <RouterLink to="/eleicoes" class="btn btn-sm btn-outline-primary rounded-pill px-3">
              Ver todas
            </RouterLink>
          </div>
          <div class="card-body p-0">
            <div v-if="loading" class="p-4">
              <div v-for="n in 3" :key="n" class="placeholder-glow mb-3">
                <span class="placeholder col-12 rounded" style="height: 32px;"></span>
              </div>
            </div>
            <div v-else-if="eleicoes.length === 0" class="text-center py-5 text-muted">
              <i class="bi bi-inbox fs-2 d-block mb-2"></i>
              Nenhuma eleição cadastrada
            </div>
            <div v-else class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th class="small fw-semibold ps-4">Descrição</th>
                    <th class="small fw-semibold">Início</th>
                    <th class="small fw-semibold">Fim</th>
                    <th class="small fw-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="e in eleicoes" :key="e.id">
                    <td class="ps-4">
                      <span class="fw-semibold small">{{ e.descricao }}</span>
                    </td>
                    <td class="small text-muted">{{ formatarData(e.inicio) }}</td>
                    <td class="small text-muted">{{ formatarData(e.fim) }}</td>
                    <td>
                      <span :class="['badge', 'rounded-pill', badgeStatus(e.status)]">
                        {{ labelStatus(e.status) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Acesso rápido -->
      <div class="col-12 col-xl-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-white border-0 py-3">
            <h6 class="fw-bold mb-0">
              <i class="bi bi-lightning-charge text-warning me-2"></i>Acesso Rápido
            </h6>
          </div>
          <div class="card-body">
            <div class="d-grid gap-2">
              <RouterLink
                v-for="acao in acoesRapidas"
                :key="acao.to"
                :to="acao.to"
                :class="['btn', `btn-outline-${acao.cor}`, 'text-start', 'd-flex', 'align-items-center', 'gap-2']"
              >
                <i :class="['bi', acao.icon]"></i>
                <span class="small fw-semibold">{{ acao.label }}</span>
              </RouterLink>
            </div>
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
const eleicoes = ref([])

const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const cards = computed(() => [
  { label: 'Eleições',   valor: totais.eleicoes,   icon: 'bi-ballot',       cor: 'blue',   to: '/eleicoes'  },
  { label: 'Candidatos', valor: totais.candidatos, icon: 'bi-person-badge', cor: 'green',  to: '/candidatos' },
  { label: 'Eleitores',  valor: totais.eleitores,  icon: 'bi-people',       cor: 'orange', to: '/eleitores' },
  { label: 'Usuários',   valor: totais.usuarios,   icon: 'bi-person-gear',  cor: 'purple', to: '/usuarios'  },
])

const acoesRapidas = [
  { to: '/eleicoes',   icon: 'bi-plus-circle',      cor: 'primary', label: 'Nova Eleição'   },
  { to: '/candidatos', icon: 'bi-person-plus',       cor: 'success', label: 'Novo Candidato' },
  { to: '/urnas',      icon: 'bi-archive',           cor: 'warning', label: 'Gerenciar Urnas' },
  { to: '/eleitores',  icon: 'bi-person-check',      cor: 'info',    label: 'Gerenciar Eleitores' },
]

function formatarData(data) {
  if (!data) return '—'
  return new Date(data).toLocaleDateString('pt-BR')
}

function badgeStatus(status) {
  return { 0: 'bg-secondary-subtle text-secondary', 1: 'bg-success-subtle text-success', 2: 'bg-danger-subtle text-danger' }[status] ?? 'bg-secondary-subtle text-secondary'
}

function labelStatus(status) {
  return { 0: 'Inativa', 1: 'Ativa', 2: 'Encerrada' }[status] ?? 'Desconhecido'
}

onMounted(async () => {
  try {
    const [resEleicoes, resCandidatos, resEleitores, resUsuarios] = await Promise.all([
      api.get('/eleicoes'),
      api.get('/candidatos'),
      api.get('/eleitores'),
      api.get('/usuarios'),
    ])
    eleicoes.value = resEleicoes.data.data || []
    totais.eleicoes   = eleicoes.value.length
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
