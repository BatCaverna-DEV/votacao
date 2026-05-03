<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import api from '../services/api.js'
import { fotoUrl } from '../utils/uploads.js'

const router = useRouter()
const auth = useAuthStore()

const eleicoes = ref([])
const loading = ref(true)

const eleicaoSelecionada = ref(null)
const detalhe = ref(null)
const loadingDetalhe = ref(false)

function badgeStatus(s) {
  return {
    1: 'badge-criada',
    2: 'badge-andamento',
    3: 'badge-apuracao',
    4: 'badge-finalizada',
  }[s] ?? 'badge-criada'
}

function labelStatus(s) {
  return { 1: 'Criada', 2: 'Em Andamento', 3: 'Em Apuração', 4: 'Finalizada' }[s] ?? '—'
}

function formatarData(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

const candidatosOrdenados = computed(() => {
  if (!detalhe.value?.candidatos) return []
  return [...detalhe.value.candidatos].sort(
    (a, b) => (b.votos?.length ?? 0) - (a.votos?.length ?? 0)
  )
})

const participacao = computed(() => {
  if (!detalhe.value || detalhe.value.totalEleitores === 0) return 0
  return Math.round((detalhe.value.totalVotos / detalhe.value.totalEleitores) * 100)
})

async function selecionarEleicao(el) {
  eleicaoSelecionada.value = el
  detalhe.value = null
  loadingDetalhe.value = true
  try {
    const { data } = await api.get(`/publica/eleicoes/${el.id}`)
    detalhe.value = data.data
  } finally {
    loadingDetalhe.value = false
  }
}

function irParaLogin() {
  if (auth.isAuthenticated) {
    router.push(auth.isAdmin ? '/dashboard' : '/votar')
  } else {
    router.push('/login')
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get('/publica/eleicoes')
    eleicoes.value = data.data || []
    if (eleicoes.value.length > 0) selecionarEleicao(eleicoes.value[0])
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="home">

    <!-- Navbar -->
    <header class="home-navbar">
      <img src="@/assets/logo.svg" alt="VotaIF" class="home-navbar__logo" />
      <div class="home-navbar__right">
        <span class="home-navbar__campus">Campus Coelho Neto · IFMA</span>
        <button class="home-navbar__btn" @click="irParaLogin">
          <i class="bi bi-box-arrow-in-right me-1"></i>
          {{ auth.isAuthenticated ? 'Painel' : 'Entrar' }}
        </button>
      </div>
    </header>

    <!-- Hero -->
    <section class="home-hero">
      <div class="home-hero__content">
        <h1 class="home-hero__title">Acompanhe as eleições<br/>do campus em tempo real</h1>
        <p class="home-hero__sub">Transparência e democracia para toda a comunidade do IFMA Campus Coelho Neto.</p>
      </div>
    </section>

    <!-- Conteúdo principal -->
    <main class="home-main">

      <!-- Lista de eleições -->
      <aside class="home-sidebar">
        <h2 class="home-sidebar__title">Eleições</h2>

        <div v-if="loading" class="home-sidebar__list">
          <div v-for="n in 3" :key="n" class="election-card-skeleton"></div>
        </div>

        <div v-else-if="eleicoes.length === 0" class="home-empty">
          <i class="bi bi-ballot fs-2 d-block mb-2"></i>
          Nenhuma eleição cadastrada
        </div>

        <div v-else class="home-sidebar__list">
          <button
            v-for="el in eleicoes"
            :key="el.id"
            :class="['election-card', { 'election-card--ativa': eleicaoSelecionada?.id === el.id }]"
            @click="selecionarEleicao(el)"
          >
            <div class="election-card__header">
              <span :class="['election-badge', badgeStatus(el.status)]">
                <span class="election-badge__dot"></span>
                {{ labelStatus(el.status) }}
              </span>
            </div>
            <p class="election-card__nome">{{ el.descricao }}</p>
            <p class="election-card__datas">
              <i class="bi bi-calendar3 me-1"></i>
              {{ formatarData(el.inicio) }}
              <span v-if="el.fim"> → {{ formatarData(el.fim) }}</span>
            </p>
          </button>
        </div>
      </aside>

      <!-- Detalhe da eleição -->
      <section class="home-detalhe">

        <div v-if="loadingDetalhe" class="home-detalhe__loading">
          <div class="spinner-border text-success" role="status"></div>
          <p class="text-muted mt-3">Carregando...</p>
        </div>

        <div v-else-if="!detalhe" class="home-detalhe__vazio">
          <i class="bi bi-ballot fs-1 d-block mb-3 text-muted"></i>
          <p class="text-muted">Selecione uma eleição para acompanhar</p>
        </div>

        <div v-else>
          <!-- Cabeçalho da eleição -->
          <div class="detalhe-header">
            <div>
              <h2 class="detalhe-header__titulo">{{ detalhe.eleicao.descricao }}</h2>
              <div class="d-flex align-items-center gap-3 mt-1 flex-wrap">
                <span :class="['election-badge', badgeStatus(detalhe.eleicao.status)]">
                  <span class="election-badge__dot"></span>
                  {{ labelStatus(detalhe.eleicao.status) }}
                </span>
                <span v-if="detalhe.eleicao.inicio || detalhe.eleicao.fim" class="text-muted small">
                  <i class="bi bi-calendar3 me-1"></i>
                  {{ formatarData(detalhe.eleicao.inicio) }} → {{ formatarData(detalhe.eleicao.fim) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Cards de estatísticas -->
          <div class="detalhe-stats">
            <div class="stat-card">
              <span class="stat-card__label">Candidatos</span>
              <span class="stat-card__value">{{ detalhe.candidatos.length }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-card__label">Eleitores</span>
              <span class="stat-card__value">{{ detalhe.totalEleitores }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-card__label">Votos computados</span>
              <span class="stat-card__value">{{ detalhe.totalVotos }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-card__label">Participação</span>
              <span class="stat-card__value">{{ participacao }}%</span>
              <div class="stat-progress">
                <div class="stat-progress__bar" :style="`width:${participacao}%`"></div>
              </div>
            </div>
          </div>

          <!-- Aviso: eleição ainda não divulga resultados -->
          <div v-if="detalhe.eleicao.status < 3" class="detalhe-aviso">
            <i class="bi bi-lock-fill me-2"></i>
            Os resultados serão divulgados após o encerramento da votação.
          </div>

          <!-- Candidatos -->
          <div class="detalhe-candidatos">
            <h3 class="detalhe-section-title">
              {{ detalhe.eleicao.status >= 3 ? 'Resultado' : 'Candidatos' }}
            </h3>

            <div v-if="detalhe.candidatos.length === 0" class="home-empty">
              Nenhum candidato cadastrado
            </div>

            <div v-else class="candidatos-lista">
              <div
                v-for="(c, idx) in candidatosOrdenados"
                :key="c.id"
                :class="[
                  'candidato-item',
                  { 'candidato-item--eleito': idx === 0 && detalhe.eleicao.status === 4 && detalhe.totalVotos > 0 },
                  { 'candidato-item--lider': idx === 0 && detalhe.eleicao.status === 3 && detalhe.totalVotos > 0 },
                ]"
              >
                <div class="candidato-item__foto">
                  <img v-if="c.foto" :src="fotoUrl(c.foto)" :alt="c.descricao" />
                  <div v-else class="candidato-item__foto-empty">
                    <i class="bi bi-person-fill"></i>
                  </div>
                  <span
                    v-if="idx === 0 && detalhe.eleicao.status === 4 && detalhe.totalVotos > 0"
                    class="candidato-item__trophy candidato-item__trophy--eleito"
                  ><i class="bi bi-patch-check-fill"></i></span>
                  <span
                    v-else-if="idx === 0 && detalhe.eleicao.status === 3 && detalhe.totalVotos > 0"
                    class="candidato-item__trophy"
                  ><i class="bi bi-trophy-fill"></i></span>
                </div>

                <div class="candidato-item__info">
                  <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
                    <span class="candidato-numero">Nº {{ c.numero }}</span>
                    <span class="candidato-nome">{{ c.descricao }}</span>
                    <span
                      v-if="idx === 0 && detalhe.eleicao.status === 4 && detalhe.totalVotos > 0"
                      class="badge-eleito"
                    ><i class="bi bi-patch-check-fill me-1"></i>Eleito</span>
                  </div>

                  <!-- Barra de resultado — só mostra em apuração/finalizada -->
                  <template v-if="detalhe.eleicao.status >= 3">
                    <div class="resultado-bar-wrap">
                      <div
                        :class="[
                          'resultado-bar',
                          idx === 0 && detalhe.eleicao.status === 4 ? 'resultado-bar--eleito' :
                          idx === 0 ? 'resultado-bar--lider' : ''
                        ]"
                        :style="`width:${detalhe.totalVotos > 0 ? Math.round((c.votos.length / detalhe.totalVotos) * 100) : 0}%`"
                      ></div>
                    </div>
                    <div class="resultado-info">
                      <span class="resultado-votos">{{ c.votos.length }} voto{{ c.votos.length !== 1 ? 's' : '' }}</span>
                      <span class="resultado-pct">{{ detalhe.totalVotos > 0 ? Math.round((c.votos.length / detalhe.totalVotos) * 100) : 0 }}%</span>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>

    <!-- Footer -->
    <footer class="home-footer">
      <span>VotaIF · IFMA Campus Coelho Neto</span>
      <span>Sistema de Votação Eletrônica</span>
    </footer>

  </div>
</template>

<style scoped>
/* ── Layout geral ─────────────────────────────────────────── */
.home {
  min-height: 100vh;
  background: #f4f6f9;
  display: flex;
  flex-direction: column;
}

/* ── Navbar ────────────────────────────────────────────────── */
.home-navbar {
  background: #fff;
  border-bottom: 1px solid #e9ecef;
  padding: 12px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}

.home-navbar__logo { height: 34px; width: auto; }

.home-navbar__right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.home-navbar__campus {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
}

.home-navbar__btn {
  background: #00A651;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 7px 16px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
}
.home-navbar__btn:hover { background: #006B3C; }

/* ── Hero ──────────────────────────────────────────────────── */
.home-hero {
  background: linear-gradient(135deg, #004d2b 0%, #006B3C 50%, #00A651 100%);
  padding: 52px 32px;
  text-align: center;
}

.home-hero__title {
  color: #fff;
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 800;
  line-height: 1.25;
  margin: 0 0 12px;
}

.home-hero__sub {
  color: rgba(255,255,255,.8);
  font-size: 1rem;
  max-width: 560px;
  margin: 0 auto;
}

/* ── Main ──────────────────────────────────────────────────── */
.home-main {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 0;
  max-width: 1200px;
  width: 100%;
  margin: 32px auto;
  padding: 0 24px;
  align-items: start;
}

@media (max-width: 768px) {
  .home-main { grid-template-columns: 1fr; padding: 0 12px; }
}

/* ── Sidebar de eleições ───────────────────────────────────── */
.home-sidebar {
  padding-right: 20px;
}

.home-sidebar__title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #6c757d;
  margin-bottom: 12px;
}

.home-sidebar__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.election-card {
  background: #fff;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  width: 100%;
  transition: all .18s;
}

.election-card:hover { border-color: #00A651; box-shadow: 0 2px 12px rgba(0,166,81,.1); }

.election-card--ativa {
  border-color: #00A651;
  background: #f0faf5;
  box-shadow: 0 2px 12px rgba(0,166,81,.15);
}

.election-card__header { margin-bottom: 8px; }

.election-card__nome {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 6px;
  line-height: 1.3;
}

.election-card__datas {
  font-size: 0.75rem;
  color: #6c757d;
  margin: 0;
}

.election-card-skeleton {
  height: 90px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 12px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Badges de status ──────────────────────────────────────── */
.election-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

.election-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.badge-criada    { background: #f0f0f0; color: #6c757d; }
.badge-criada .election-badge__dot { background: #6c757d; }

.badge-andamento { background: #e6f7ee; color: #006B3C; }
.badge-andamento .election-badge__dot { background: #00A651; animation: pulse 1.2s infinite; }

.badge-apuracao  { background: #fff8e1; color: #856404; }
.badge-apuracao .election-badge__dot { background: #ffc107; }

.badge-finalizada { background: #fde8e8; color: #b91c1c; }
.badge-finalizada .election-badge__dot { background: #dc3545; }

@keyframes pulse {
  0%, 100% { opacity: 1; } 50% { opacity: .4; }
}

/* ── Detalhe ────────────────────────────────────────────────── */
.home-detalhe {
  background: #fff;
  border-radius: 16px;
  padding: 28px 32px;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
  min-height: 400px;
}

.home-detalhe__loading,
.home-detalhe__vazio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  text-align: center;
}

.detalhe-header { margin-bottom: 24px; }

.detalhe-header__titulo {
  font-size: 1.4rem;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.3;
}

/* Stats */
.detalhe-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

@media (max-width: 900px) {
  .detalhe-stats { grid-template-columns: repeat(2, 1fr); }
}

.stat-card {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-card__label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: #6c757d;
}

.stat-card__value {
  font-size: 1.6rem;
  font-weight: 800;
  color: #00A651;
  line-height: 1;
}

.stat-progress {
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  margin-top: 4px;
  overflow: hidden;
}

.stat-progress__bar {
  height: 100%;
  background: #00A651;
  border-radius: 2px;
  transition: width .4s;
}

/* Aviso */
.detalhe-aviso {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
}

/* Candidatos */
.detalhe-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #6c757d;
  margin-bottom: 14px;
}

.candidatos-lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.candidato-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.candidato-item--lider  { background: #fffdf0; border-color: #ffc107; }
.candidato-item--eleito { background: #f0faf5; border-color: #00A651; }

.candidato-item__foto {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}

.candidato-item__foto img,
.candidato-item__foto-empty {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #dee2e6;
  display: block;
}

.candidato-item--lider .candidato-item__foto img,
.candidato-item--lider .candidato-item__foto-empty { border-color: #ffc107; }
.candidato-item--eleito .candidato-item__foto img,
.candidato-item--eleito .candidato-item__foto-empty { border-color: #00A651; }

.candidato-item__foto-empty {
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  color: #adb5bd;
}

.candidato-item__trophy {
  position: absolute;
  bottom: -3px;
  right: -3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ffc107;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  border: 2px solid #fff;
}

.candidato-item__trophy--eleito { background: #00A651; }

.candidato-item__info { flex: 1; min-width: 0; }

.candidato-numero {
  font-size: 0.75rem;
  font-weight: 700;
  background: #e9ecef;
  color: #495057;
  padding: 2px 8px;
  border-radius: 6px;
}

.candidato-nome {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1a1a1a;
}

.badge-eleito {
  display: inline-flex;
  align-items: center;
  background: #00A651;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

.resultado-bar-wrap {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 6px;
}

.resultado-bar {
  height: 100%;
  background: #00A651;
  border-radius: 4px;
  transition: width .5s ease;
}

.resultado-bar--lider  { background: #ffc107; }
.resultado-bar--eleito { background: #00A651; }

.resultado-info {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.resultado-votos { font-size: 0.78rem; font-weight: 600; color: #495057; }
.resultado-pct   { font-size: 0.78rem; color: #6c757d; }

/* Empty */
.home-empty {
  text-align: center;
  color: #6c757d;
  padding: 32px 0;
  font-size: 0.9rem;
}

/* Footer */
.home-footer {
  background: #0a1f10;
  color: rgba(255,255,255,.5);
  padding: 20px 32px;
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-top: auto;
}

@media (max-width: 600px) {
  .home-footer { flex-direction: column; gap: 4px; text-align: center; }
  .home-navbar__campus { display: none; }
}
</style>
