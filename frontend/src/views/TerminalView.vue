<template>
  <div class="terminal">

    <!-- ETAPA 1 — Identificação por matrícula -->
    <transition name="fade" mode="out-in">
      <div v-if="etapa === 'identificacao'" key="id" class="terminal-tela">
        <img src="@/assets/logo.svg" alt="VotaIF" class="terminal-brand-logo" />
        <h2 class="terminal-titulo">Terminal de Votação</h2>
        <p v-if="urnaDescricao" class="terminal-urna-label">
          <i class="bi bi-archive-fill me-1"></i>{{ urnaDescricao }}
        </p>
        <p class="terminal-subtitulo">Digite sua matrícula para iniciar</p>

        <form @submit.prevent="identificar" class="terminal-form">
          <input
            v-model="matricula"
            type="text"
            class="terminal-input"
            placeholder="Sua matrícula"
            autofocus
            :disabled="identificando"
          />
          <div v-if="erroIdentificacao" class="terminal-erro">
            <i class="bi bi-exclamation-circle me-2"></i>{{ erroIdentificacao }}
          </div>
          <button type="submit" class="terminal-btn" :disabled="!matricula.trim() || identificando">
            <span v-if="identificando" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-arrow-right-circle me-2"></i>
            Continuar
          </button>
          <button type="button" class="terminal-btn-voltar" @click="voltar">
            <i class="bi bi-arrow-left me-1"></i> Voltar ao painel
          </button>
        </form>
      </div>

      <!-- ETAPA 2 — Votação -->
      <div v-else-if="etapa === 'votacao'" key="vot" class="terminal-tela">
        <div class="terminal-saudacao">
          <div class="saudacao-avatar">{{ iniciais }}</div>
          <div>
            <p class="saudacao-nome">{{ dadosEleitor.pessoa.nome }}</p>
            <p class="saudacao-eleicao">{{ dadosEleitor.eleicao.descricao }}</p>
          </div>
        </div>

        <p class="terminal-instrucao">Selecione o candidato de sua preferência</p>

        <div class="candidatos-lista">
          <button
            v-for="c in dadosEleitor.eleicao.candidatos"
            :key="c.id"
            type="button"
            :class="['candidato-card', { 'candidato-card--ativo': escolha === c.id }]"
            @click="escolha = c.id"
          >
            <div class="candidato-card__foto">
              <img v-if="c.foto" :src="c.foto" :alt="c.descricao" />
              <div v-else class="candidato-card__foto-empty"><i class="bi bi-person-fill"></i></div>
            </div>
            <div class="candidato-card__info">
              <span class="candidato-card__numero">{{ c.numero }}</span>
              <span class="candidato-card__nome">{{ c.descricao }}</span>
            </div>
            <div class="candidato-card__check">
              <i :class="escolha === c.id ? 'bi bi-check-circle-fill text-primary' : 'bi bi-circle text-muted'"></i>
            </div>
          </button>
        </div>

        <div class="terminal-acoes">
          <button class="terminal-btn-sec" @click="reiniciar">
            <i class="bi bi-arrow-left me-1"></i> Cancelar
          </button>
          <button class="terminal-btn" :disabled="!escolha" @click="etapa = 'confirmacao'">
            Confirmar
            <i class="bi bi-arrow-right ms-2"></i>
          </button>
        </div>
      </div>

      <!-- ETAPA 3 — Confirmação -->
      <div v-else-if="etapa === 'confirmacao'" key="conf" class="terminal-tela">
        <div class="terminal-logo terminal-logo--warn">
          <i class="bi bi-shield-check"></i>
        </div>
        <h3 class="terminal-titulo">Confirme seu voto</h3>
        <p class="terminal-subtitulo">Você está votando em:</p>

        <div class="confirmar-card">
          <div class="confirmar-foto">
            <img v-if="candidatoEscolhido?.foto" :src="candidatoEscolhido.foto" :alt="candidatoEscolhido.descricao" />
            <div v-else class="confirmar-foto-empty"><i class="bi bi-person-fill"></i></div>
          </div>
          <div class="confirmar-numero">{{ candidatoEscolhido?.numero }}</div>
          <div class="confirmar-nome">{{ candidatoEscolhido?.descricao }}</div>
          <div class="confirmar-eleicao">{{ dadosEleitor?.eleicao?.descricao }}</div>
        </div>

        <div v-if="erroVoto" class="terminal-erro">
          <i class="bi bi-exclamation-circle me-2"></i>{{ erroVoto }}
        </div>

        <div class="terminal-acoes">
          <button class="terminal-btn-sec" @click="etapa = 'votacao'" :disabled="votando">
            <i class="bi bi-pencil me-1"></i> Alterar
          </button>
          <button class="terminal-btn terminal-btn--green" :disabled="votando" @click="registrarVoto">
            <span v-if="votando" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-check2-all me-2"></i>
            Votar
          </button>
        </div>
      </div>

      <!-- ETAPA 4 — Sucesso -->
      <div v-else-if="etapa === 'sucesso'" key="ok" class="terminal-tela terminal-tela--sucesso">
        <div class="sucesso-icone">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <h2 class="terminal-titulo">Voto registrado!</h2>
        <p class="terminal-subtitulo">Obrigado por participar, {{ dadosEleitor?.pessoa?.nome?.split(' ')[0] }}.</p>
        <p class="sucesso-contador">Reiniciando em {{ contador }}s...</p>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api.js'

const route = useRoute()
const router = useRouter()
const urnaId = route.params.urnaId

const urnaDescricao = ref('')

const etapa = ref('identificacao')
const matricula = ref('')
const identificando = ref(false)
const erroIdentificacao = ref('')
const dadosEleitor = ref(null)
const escolha = ref(null)
const votando = ref(false)
const erroVoto = ref('')
const contador = ref(5)

const iniciais = computed(() => {
  const nome = dadosEleitor.value?.pessoa?.nome || ''
  return nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
})

const candidatoEscolhido = computed(() =>
  dadosEleitor.value?.eleicao?.candidatos?.find(c => c.id === escolha.value) ?? null
)

async function identificar() {
  erroIdentificacao.value = ''
  identificando.value = true
  try {
    const { data } = await api.post('/terminal/identificar', { matricula: matricula.value.trim(), urnas_id: urnaId })
    dadosEleitor.value = data.data
    escolha.value = null
    etapa.value = 'votacao'
  } catch (err) {
    erroIdentificacao.value = err.response?.data?.message || 'Erro ao identificar eleitor.'
  } finally {
    identificando.value = false
  }
}

async function registrarVoto() {
  erroVoto.value = ''
  votando.value = true
  try {
    await api.post('/terminal/votar', {
      eleitores_id: dadosEleitor.value.eleitor.id,
      candidatos_id: escolha.value,
      urnas_id: urnaId,
    })
    etapa.value = 'sucesso'
    iniciarContador()
  } catch (err) {
    erroVoto.value = err.response?.data?.message || 'Erro ao registrar voto. Tente novamente.'
  } finally {
    votando.value = false
  }
}

function iniciarContador() {
  contador.value = 5
  const t = setInterval(() => {
    contador.value--
    if (contador.value <= 0) {
      clearInterval(t)
      reiniciar()
    }
  }, 1000)
}

function reiniciar() {
  etapa.value = 'identificacao'
  matricula.value = ''
  dadosEleitor.value = null
  escolha.value = null
  erroIdentificacao.value = ''
  erroVoto.value = ''
}

function voltar() {
  router.back()
}

onMounted(async () => {
  try {
    const { data } = await api.get(`/urnas/${urnaId}`)
    urnaDescricao.value = data.data?.descricao || ''
  } catch {
    // silencia — a descrição é informativa
  }
})
</script>

<style scoped>
.terminal {
  min-height: 100vh;
  background: #0a1f10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.terminal-tela {
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

/* Logo */
.terminal-brand-logo {
  height: 52px;
  width: auto;
  filter: brightness(0) invert(1);
  opacity: 0.92;
}

.terminal-logo {
  width: 80px;
  height: 80px;
  background: #00A651;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.4rem;
  color: #fff;
  box-shadow: 0 4px 20px rgba(0,166,81,.4);
}

.terminal-logo--warn {
  background: #198754;
  box-shadow: 0 4px 20px rgba(25,135,84,.4);
}

.terminal-titulo {
  color: #fff;
  font-weight: 800;
  font-size: 1.8rem;
  text-align: center;
  margin: 0;
}

.terminal-subtitulo {
  color: rgba(255,255,255,.55);
  text-align: center;
  margin: 0;
  font-size: 1rem;
}

.terminal-urna-label {
  background: rgba(0,166,81,.2);
  border: 1px solid rgba(0,166,81,.4);
  color: #6ee0a0;
  border-radius: 30px;
  padding: 6px 18px;
  font-size: 0.88rem;
  font-weight: 600;
  margin: 0;
}

/* Form de matrícula */
.terminal-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.terminal-input {
  width: 100%;
  background: rgba(255,255,255,.08);
  border: 2px solid rgba(255,255,255,.15);
  border-radius: 14px;
  color: #fff;
  font-size: 1.3rem;
  font-weight: 600;
  padding: 18px 22px;
  text-align: center;
  outline: none;
  transition: border-color .2s;
  letter-spacing: 2px;
}

.terminal-input::placeholder { color: rgba(255,255,255,.3); letter-spacing: 0; }
.terminal-input:focus { border-color: #00A651; }

/* Erro */
.terminal-erro {
  background: rgba(220,53,69,.15);
  border: 1px solid rgba(220,53,69,.4);
  color: #f87171;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 0.9rem;
  text-align: center;
  width: 100%;
}

/* Botões */
.terminal-btn {
  background: #00A651;
  border: none;
  border-radius: 14px;
  color: #fff;
  font-size: 1.05rem;
  font-weight: 700;
  padding: 16px 32px;
  cursor: pointer;
  transition: all .18s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.terminal-btn:hover:not(:disabled) { background: #006B3C; transform: translateY(-1px); }
.terminal-btn:disabled { opacity: .45; cursor: not-allowed; transform: none; }
.terminal-btn--green { background: #198754; }
.terminal-btn--green:hover:not(:disabled) { background: #157347; }

.terminal-btn-sec {
  background: rgba(255,255,255,.08);
  border: 2px solid rgba(255,255,255,.15);
  border-radius: 14px;
  color: rgba(255,255,255,.75);
  font-size: 1.05rem;
  font-weight: 600;
  padding: 16px 24px;
  cursor: pointer;
  transition: all .18s;
  display: flex;
  align-items: center;
}

.terminal-btn-sec:hover:not(:disabled) { background: rgba(255,255,255,.14); color: #fff; }
.terminal-btn-sec:disabled { opacity: .4; cursor: not-allowed; }

.terminal-acoes {
  display: flex;
  gap: 14px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

/* Saudação */
.terminal-saudacao {
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
}

.saudacao-avatar {
  width: 48px;
  height: 48px;
  background: #00A651;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
  color: #fff;
  flex-shrink: 0;
}

.saudacao-nome {
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  margin: 0;
}

.saudacao-eleicao {
  color: rgba(255,255,255,.5);
  font-size: 0.82rem;
  margin: 0;
}

.terminal-instrucao {
  color: rgba(255,255,255,.6);
  font-size: 0.9rem;
  margin: 0;
}

/* Lista de candidatos */
.candidatos-lista {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.candidato-card {
  width: 100%;
  background: rgba(255,255,255,.05);
  border: 2px solid rgba(255,255,255,.1);
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all .18s;
  text-align: left;
}

.candidato-card:hover {
  background: rgba(255,255,255,.1);
  border-color: rgba(255,255,255,.25);
}

.candidato-card--ativo {
  background: rgba(0,166,81,.18);
  border-color: #00A651;
  box-shadow: 0 0 0 3px rgba(0,166,81,.2);
}

.candidato-card__foto {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid rgba(255,255,255,.15);
}

.candidato-card__foto img { width: 100%; height: 100%; object-fit: cover; }

.candidato-card__foto-empty {
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  color: rgba(255,255,255,.3);
}

.candidato-card__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.candidato-card__numero {
  font-size: 1.6rem;
  font-weight: 800;
  color: #6ee0a0;
  line-height: 1;
}

.candidato-card__nome {
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(255,255,255,.85);
}

.candidato-card__check { font-size: 1.4rem; }

/* Confirmar */
.confirmar-card {
  background: rgba(255,255,255,.06);
  border: 2px solid rgba(255,255,255,.12);
  border-radius: 16px;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.confirmar-foto {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(255,255,255,.2);
}

.confirmar-foto img { width: 100%; height: 100%; object-fit: cover; }

.confirmar-foto-empty {
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.6rem;
  color: rgba(255,255,255,.3);
}

.confirmar-numero {
  font-size: 3rem;
  font-weight: 900;
  color: #6ee0a0;
  line-height: 1;
}

.confirmar-nome {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
}

.confirmar-eleicao {
  font-size: 0.85rem;
  color: rgba(255,255,255,.45);
}

/* Sucesso */
.terminal-tela--sucesso { gap: 16px; }

.sucesso-icone {
  font-size: 6rem;
  color: #198754;
  filter: drop-shadow(0 4px 20px rgba(25,135,84,.5));
}

.sucesso-contador {
  color: rgba(255,255,255,.35);
  font-size: 0.9rem;
  margin: 0;
}

.terminal-btn-voltar {
  background: none;
  border: none;
  color: rgba(255,255,255,.3);
  font-size: 0.82rem;
  cursor: pointer;
  text-align: center;
  padding: 4px;
  transition: color .18s;
}
.terminal-btn-voltar:hover { color: rgba(255,255,255,.6); }

/* Transição */
.fade-enter-active, .fade-leave-active { transition: opacity .25s ease, transform .25s ease; }
.fade-enter-from { opacity: 0; transform: translateY(12px); }
.fade-leave-to   { opacity: 0; transform: translateY(-12px); }
</style>
