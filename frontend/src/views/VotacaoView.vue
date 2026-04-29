<template>
  <div class="voto-wrapper">

    <!-- Carregando -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary mb-3"></div>
      <p class="text-muted">Carregando suas eleições...</p>
    </div>

    <!-- Sem eleições disponíveis -->
    <div v-else-if="eleicoes.length === 0" class="empty-state">
      <div class="empty-icon"><i class="bi bi-ballot"></i></div>
      <h5 class="fw-bold mt-3">Nenhuma votação disponível</h5>
      <p class="text-muted small">Você não está liberado para votar em nenhuma eleição no momento.</p>
    </div>

    <!-- Lista de eleições -->
    <template v-else>
      <div class="voto-title">
        <h4 class="fw-bold mb-1">Sua votação</h4>
        <p class="text-muted small mb-0">Selecione um candidato e confirme seu voto.</p>
      </div>

      <div v-for="item in eleicoes" :key="item.id" class="voto-card">
        <!-- Cabeçalho da eleição -->
        <div class="voto-card__header">
          <div>
            <h5 class="fw-bold mb-0">{{ item.eleicao.descricao }}</h5>
            <p class="text-muted small mb-0 mt-1" v-if="item.eleicao.inicio || item.eleicao.fim">
              <i class="bi bi-calendar3 me-1"></i>
              {{ formatarData(item.eleicao.inicio) }} → {{ formatarData(item.eleicao.fim) }}
            </p>
          </div>
          <span class="badge rounded-pill bg-primary-subtle text-primary">Você está liberado</span>
        </div>

        <!-- Sem urna aberta -->
        <div v-if="!urnaDisponivel(item)" class="alert alert-warning py-2 small mb-0 mx-3 mb-3">
          <i class="bi bi-exclamation-triangle me-1"></i>
          Nenhuma urna está aberta no momento. Aguarde a abertura das urnas.
        </div>

        <!-- Candidatos -->
        <div v-else class="voto-card__body">
          <p class="small text-muted fw-semibold mb-3">Escolha um candidato:</p>
          <div class="candidatos-grid">
            <button
              v-for="c in item.eleicao.candidatos"
              :key="c.id"
              type="button"
              :class="['candidato-btn', { 'candidato-btn--selected': selecionado[item.id] === c.id }]"
              @click="selecionado[item.id] = c.id"
            >
              <div class="candidato-foto">
                <img v-if="c.foto" :src="c.foto" :alt="c.descricao" />
                <div v-else class="candidato-foto__empty"><i class="bi bi-person-fill"></i></div>
              </div>
              <div class="candidato-numero">{{ c.numero }}</div>
              <div class="candidato-nome">{{ c.descricao }}</div>
              <div v-if="selecionado[item.id] === c.id" class="candidato-check">
                <i class="bi bi-check-circle-fill"></i>
              </div>
            </button>
          </div>

          <div class="voto-card__footer">
            <button
              class="btn btn-primary btn-lg px-5"
              :disabled="!selecionado[item.id]"
              @click="abrirConfirmacao(item)"
            >
              <i class="bi bi-check2-all me-2"></i>Confirmar voto
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal de confirmação -->
    <div class="modal fade" tabindex="-1" ref="modalConfirmarEl">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-body text-center p-5">
            <div class="confirm-icon mb-3">
              <i class="bi bi-shield-check"></i>
            </div>
            <h5 class="fw-bold mb-1">Confirmar seu voto?</h5>
            <p class="text-muted small mb-4">Esta ação não pode ser desfeita.</p>

            <div v-if="itemConfirmando" class="confirm-candidato mb-4">
              <div class="confirm-foto">
                <img v-if="candidatoSelecionado?.foto" :src="candidatoSelecionado.foto" :alt="candidatoSelecionado.descricao" />
                <div v-else class="confirm-foto__empty"><i class="bi bi-person-fill"></i></div>
              </div>
              <div class="confirm-numero">{{ candidatoSelecionado?.numero }}</div>
              <div class="fw-bold mt-1">{{ candidatoSelecionado?.descricao }}</div>
              <div class="text-muted small">{{ itemConfirmando?.eleicao?.descricao }}</div>
            </div>

            <div v-if="erroVoto" class="alert alert-danger py-2 small mb-3">{{ erroVoto }}</div>

            <div class="d-flex gap-3 justify-content-center">
              <button type="button" class="btn btn-outline-secondary px-4" @click="fecharConfirmacao" :disabled="votando">
                Cancelar
              </button>
              <button type="button" class="btn btn-primary px-4 d-flex align-items-center gap-2" @click="confirmarVoto" :disabled="votando">
                <span v-if="votando" class="spinner-border spinner-border-sm"></span>
                <i v-else class="bi bi-check2"></i>
                Votar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tela de sucesso (após votar) -->
    <div v-if="votouAgora" class="sucesso-overlay">
      <div class="sucesso-box">
        <div class="sucesso-icon"><i class="bi bi-check-circle-fill"></i></div>
        <h4 class="fw-bold mt-3 mb-1">Voto registrado!</h4>
        <p class="text-muted small">Seu voto foi computado com sucesso.</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Modal } from 'bootstrap'
import api from '../services/api.js'

const loading = ref(true)
const eleicoes = ref([])
const selecionado = reactive({})

const modalConfirmarEl = ref(null)
let bsModalConfirmar = null

const itemConfirmando = ref(null)
const votando = ref(false)
const erroVoto = ref('')
const votouAgora = ref(false)

const candidatoSelecionado = computed(() => {
  if (!itemConfirmando.value) return null
  const cid = selecionado[itemConfirmando.value.id]
  return itemConfirmando.value.eleicao.candidatos.find(c => c.id === cid) ?? null
})

function formatarData(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function urnaDisponivel(item) {
  return item.eleicao.urnas?.length > 0
}

function abrirConfirmacao(item) {
  erroVoto.value = ''
  itemConfirmando.value = item
  bsModalConfirmar.show()
}

function fecharConfirmacao() {
  bsModalConfirmar.hide()
}

async function confirmarVoto() {
  votando.value = true
  erroVoto.value = ''
  try {
    const item = itemConfirmando.value
    const urna = item.eleicao.urnas[0]
    await api.post('/votos', {
      candidatos_id: selecionado[item.id],
      urnas_id: urna.id,
      eleitores_id: item.id,
    })
    fecharConfirmacao()
    eleicoes.value = eleicoes.value.filter(e => e.id !== item.id)
    votouAgora.value = true
    setTimeout(() => { votouAgora.value = false }, 4000)
  } catch (err) {
    erroVoto.value = err.response?.data?.message || 'Erro ao registrar voto. Tente novamente.'
  } finally {
    votando.value = false
  }
}

onMounted(async () => {
  bsModalConfirmar = new Modal(modalConfirmarEl.value)
  try {
    const { data } = await api.get('/votacao/minhas-eleicoes')
    eleicoes.value = data.data || []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.voto-wrapper {
  width: 100%;
  max-width: 680px;
}

.voto-title {
  text-align: center;
  margin-bottom: 28px;
}

/* Card da eleição */
.voto-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,.07);
  overflow: hidden;
  margin-bottom: 24px;
}

.voto-card__header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.voto-card__body {
  padding: 24px;
}

.voto-card__footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  margin-top: 20px;
}

/* Grid de candidatos */
.candidatos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px;
}

.candidato-btn {
  position: relative;
  background: #f8f9fa;
  border: 2px solid #dee2e6;
  border-radius: 12px;
  padding: 20px 12px 16px;
  cursor: pointer;
  text-align: center;
  transition: all .18s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.candidato-btn:hover {
  border-color: #0d6efd;
  background: #f0f5ff;
  transform: translateY(-2px);
}

.candidato-btn--selected {
  border-color: #0d6efd;
  background: #e8f0fe;
  box-shadow: 0 0 0 3px rgba(13,110,253,.15);
}

.candidato-foto {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #dee2e6;
  margin-bottom: 4px;
}

.candidato-foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.candidato-foto__empty {
  width: 100%;
  height: 100%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: #adb5bd;
}

.candidato-numero {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0d6efd;
  line-height: 1;
}

.candidato-nome {
  font-size: 0.8rem;
  font-weight: 600;
  color: #212529;
  line-height: 1.3;
}

.candidato-check {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #0d6efd;
  font-size: 1.1rem;
}

/* Confirm modal */
.confirm-icon {
  width: 64px;
  height: 64px;
  background: #e8f0fe;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-size: 1.8rem;
  color: #0d6efd;
}

.confirm-candidato {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.confirm-foto {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #dee2e6;
}

.confirm-foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.confirm-foto__empty {
  width: 100%;
  height: 100%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #adb5bd;
}

.confirm-numero {
  font-size: 2rem;
  font-weight: 800;
  color: #0d6efd;
  line-height: 1;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: #f0f3ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-size: 2.2rem;
  color: #6c757d;
}

/* Sucesso overlay */
.sucesso-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn .3s ease;
}

.sucesso-box {
  background: #fff;
  border-radius: 20px;
  padding: 48px 40px;
  text-align: center;
  box-shadow: 0 8px 40px rgba(0,0,0,.2);
}

.sucesso-icon {
  font-size: 4rem;
  color: #198754;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
</style>
