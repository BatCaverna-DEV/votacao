<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api.js'

const route = useRoute()
const id = route.params.id

// Intervalo para acompanhar se o eleitor liberado já concluiu o voto
const INTERVALO_ATUALIZACAO = 3000

const loading = ref(true)
const enviando = ref(false)
const erroCarregar = ref('')
const alerta = ref({ mensagem: '', tipo: 'success' })
const matricula = ref('')
const inputEl = ref(null)

const urna = ref(null)
const eleicao = ref(null)
const eleitor = ref(null)

let atualizador = null

const emAndamento = computed(() => eleicao.value?.status === 2)

function labelStatus(s) {
  return { 1: 'Não iniciada', 2: 'Em andamento', 3: 'Encerrada', 4: 'Encerrada' }[s] ?? '—'
}
function badgeStatus(s) {
  return { 1: 'bg-secondary', 2: 'bg-success', 3: 'bg-dark', 4: 'bg-dark' }[s] ?? 'bg-secondary'
}

function mostrarAlerta(mensagem, tipo = 'success') {
  alerta.value = { mensagem, tipo }
}

function focarMatricula() {
  nextTick(() => inputEl.value?.focus())
}

async function carregar() {
  try {
    const { data } = await api.get(`/urnas/${id}/painel`)
    const anterior = eleitor.value
    urna.value = data.data.urna
    eleicao.value = data.data.eleicao
    eleitor.value = data.data.eleitor
    erroCarregar.value = ''

    // O eleitor que estava liberado concluiu o voto na urna
    if (anterior && !eleitor.value) {
      mostrarAlerta(`${anterior.nome} concluiu a votação. A urna está livre.`)
      focarMatricula()
    }
  } catch (err) {
    erroCarregar.value = err.response?.data?.message || 'Não foi possível carregar a urna.'
  } finally {
    loading.value = false
  }
}

async function liberar() {
  if (!matricula.value.trim()) return
  enviando.value = true
  alerta.value.mensagem = ''
  try {
    const { data } = await api.put(`/urnas/${id}/liberar`, { matricula: matricula.value.trim() })
    eleitor.value = data.data.eleitor
    matricula.value = ''
    mostrarAlerta(`${eleitor.value.nome} liberado. O eleitor já pode votar na urna.`)
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao liberar o eleitor.', 'danger')
    focarMatricula()
  } finally {
    enviando.value = false
  }
}

async function cancelar() {
  if (!window.confirm(`Cancelar a liberação de ${eleitor.value?.nome}? O eleitor poderá ser liberado novamente.`)) return
  enviando.value = true
  try {
    await api.put(`/urnas/${id}/cancelar`)
    mostrarAlerta(`Liberação de ${eleitor.value?.nome} cancelada.`, 'secondary')
    eleitor.value = null
    focarMatricula()
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao cancelar a liberação.', 'danger')
    carregar()
  } finally {
    enviando.value = false
  }
}

onMounted(async () => {
  await carregar()
  focarMatricula()
  atualizador = setInterval(carregar, INTERVALO_ATUALIZACAO)
})

onBeforeUnmount(() => clearInterval(atualizador))
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-items-start gap-3 mb-4">
      <RouterLink :to="eleicao ? `/eleicoes/${eleicao.id}` : '/urnas'" class="btn btn-sm btn-outline-secondary mt-1">
        <i class="bi bi-arrow-left"></i>
      </RouterLink>
      <div class="flex-grow-1">
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <h5 class="fw-bold mb-0">{{ urna?.descricao || 'Painel da urna' }}</h5>
          <span v-if="eleicao" :class="['badge rounded-pill', badgeStatus(eleicao.status)]">
            {{ labelStatus(eleicao.status) }}
          </span>
          <span
            v-if="urna"
            :class="['badge rounded-pill', urna.conectada ? 'bg-success-subtle text-success-emphasis' : 'bg-warning-subtle text-warning-emphasis']"
            :title="urna.conectada ? 'A urna está aberta em um dispositivo' : 'Nenhum dispositivo está com esta urna aberta'"
          >
            <i :class="['bi me-1', urna.conectada ? 'bi-wifi' : 'bi-wifi-off']"></i>
            {{ urna.conectada ? 'Urna conectada' : 'Urna desconectada' }}
          </span>
        </div>
        <p class="text-muted small mb-0">
          Painel do mesário<span v-if="eleicao"> · {{ eleicao.descricao }}</span>
        </p>
      </div>
    </div>

    <div v-if="loading" class="placeholder-glow">
      <span class="placeholder col-12 rounded" style="height:160px"></span>
    </div>

    <div v-else-if="!urna" class="alert alert-danger">{{ erroCarregar }}</div>

    <div v-else class="row justify-content-center">
      <div class="col-12 col-lg-8 col-xl-6">
        <div v-if="erroCarregar" class="alert alert-warning small">
          <i class="bi bi-wifi-off me-1"></i>{{ erroCarregar }}
        </div>

        <div v-if="alerta.mensagem" :class="['alert alert-dismissible fade show', `alert-${alerta.tipo}`]" role="alert">
          {{ alerta.mensagem }}
          <button type="button" class="btn-close" @click="alerta.mensagem = ''"></button>
        </div>

        <div class="card border-0 shadow-sm">
          <!-- Eleição fora de andamento -->
          <div v-if="!emAndamento" class="card-body text-center py-5 text-muted">
            <i :class="['bi fs-1 d-block mb-2', eleicao.status === 1 ? 'bi-hourglass-split' : 'bi-lock-fill']"></i>
            <p class="mb-0" v-if="eleicao.status === 1">
              A eleição ainda não foi iniciada. Inicie-a na tela da eleição para liberar eleitores.
            </p>
            <p class="mb-0" v-else>A eleição foi encerrada. Esta urna não recebe mais votos.</p>
          </div>

          <!-- Eleitor liberado, aguardando o voto -->
          <div v-else-if="eleitor" class="card-body text-center py-5">
            <div class="spinner-grow text-success mb-3" role="status"></div>
            <p class="text-muted small text-uppercase fw-semibold mb-1">Eleitor votando</p>
            <h4 class="fw-bold mb-0">{{ eleitor.nome }}</h4>
            <p class="text-muted mb-4">Matrícula {{ eleitor.matricula }}</p>
            <p class="small text-muted">O painel é atualizado automaticamente quando o voto for concluído.</p>
            <button class="btn btn-outline-danger" :disabled="enviando" @click="cancelar">
              <i class="bi bi-x-circle me-1"></i> Cancelar liberação
            </button>
          </div>

          <!-- Urna livre -->
          <div v-else class="card-body p-4">
            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="badge bg-success-subtle text-success-emphasis">
                <i class="bi bi-check-circle-fill me-1"></i>Urna livre
              </span>
              <span class="small text-muted">Informe a matrícula do próximo eleitor.</span>
            </div>
            <form class="d-flex gap-2" @submit.prevent="liberar">
              <input
                ref="inputEl"
                v-model="matricula"
                type="text"
                class="form-control form-control-lg"
                placeholder="Matrícula do eleitor"
                :disabled="enviando"
              />
              <button type="submit" class="btn btn-primary btn-lg text-nowrap" :disabled="enviando || !matricula.trim()">
                <span v-if="enviando" class="spinner-border spinner-border-sm me-1"></span>
                <i v-else class="bi bi-unlock-fill me-1"></i>
                Liberar
              </button>
            </form>
          </div>
        </div>

        <p class="text-muted small mt-3 mb-0">
          ID da urna: <code>{{ urna.id }}</code>
        </p>
      </div>
    </div>
  </div>
</template>
