<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { fotoUrl } from '../utils/uploads.js'
import { somTecla, somErro } from '../utils/som.js'

// etapa: 'aguardando' | 'encerrada' | 'bloqueada' | 'votacao' | 'enviando' | 'fim'
const props = defineProps({
  etapa: { type: String, required: true },
  eleicao: { type: Object, default: null },
  urna: { type: Object, default: null },
  candidatos: { type: Array, default: () => [] },
})
const emit = defineEmits(['votar'])

const digitos = ref('')
const branco = ref(false)

// Todos os números têm a quantidade de dígitos do maior número cadastrado
const totalDigitos = computed(() =>
  Math.max(1, ...props.candidatos.map(c => String(c.numero).length))
)

const numeroCompleto = computed(() => digitos.value.length === totalDigitos.value)

const candidato = computed(() =>
  numeroCompleto.value ? props.candidatos.find(c => c.numero === Number(digitos.value)) ?? null : null
)

// Número completo que não pertence a nenhum candidato vira voto nulo
const nulo = computed(() => numeroCompleto.value && !candidato.value)

const podeConfirmar = computed(() => branco.value || numeroCompleto.value)

const emVotacao = computed(() => props.etapa === 'votacao')

watch(() => props.etapa, (etapa) => {
  if (etapa === 'votacao') corrige(false)
})

function digitar(n) {
  if (!emVotacao.value) return
  if (branco.value || numeroCompleto.value) return somErro()
  somTecla()
  digitos.value += String(n)
}

function votoBranco() {
  if (!emVotacao.value) return
  // Para votar em branco o número precisa estar vazio (use CORRIGE antes)
  if (digitos.value || branco.value) return somErro()
  somTecla()
  branco.value = true
}

function corrige(comSom = true) {
  if (comSom) {
    if (!emVotacao.value) return
    somTecla()
  }
  digitos.value = ''
  branco.value = false
}

function confirma() {
  if (!emVotacao.value) return
  if (!podeConfirmar.value) return somErro()
  emit('votar', branco.value ? { branco: true } : { numero: Number(digitos.value) })
}

// Teclado físico: números, Backspace/Delete = CORRIGE, Enter = CONFIRMA, B = BRANCO
function onKeydown(e) {
  if (!emVotacao.value) return
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return
  if (/^[0-9]$/.test(e.key)) digitar(e.key)
  else if (e.key === 'Backspace' || e.key === 'Delete') corrige()
  else if (e.key === 'Enter') confirma()
  else if (e.key.toLowerCase() === 'b') votoBranco()
  else return
  e.preventDefault()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const teclas = [1, 2, 3, 4, 5, 6, 7, 8, 9]
</script>

<template>
  <div class="urna">
    <div class="urna__topo">
      <img src="@/assets/logo.svg" alt="VotaIF" class="urna__logo" />
      <span class="urna__identificacao">{{ urna?.descricao }}</span>
    </div>

    <div class="urna__corpo">
      <!-- Tela -->
      <div class="tela">
        <!-- Eleição não iniciada -->
        <div v-if="etapa === 'aguardando'" class="tela__centro">
          <i class="bi bi-hourglass-split tela__icone"></i>
          <p class="tela__titulo">Aguardando o início da eleição</p>
          <p class="tela__sub">{{ eleicao?.descricao }}</p>
        </div>

        <!-- Eleição encerrada -->
        <div v-else-if="etapa === 'encerrada'" class="tela__centro">
          <i class="bi bi-lock-fill tela__icone"></i>
          <p class="tela__titulo">Eleição encerrada</p>
          <p class="tela__sub">{{ eleicao?.descricao }}</p>
        </div>

        <!-- Aguardando o mesário liberar -->
        <div v-else-if="etapa === 'bloqueada'" class="tela__centro">
          <p class="tela__titulo">{{ eleicao?.descricao }}</p>
          <p class="tela__sub">Aguarde o mesário liberar a urna</p>
        </div>

        <!-- Registrando o voto -->
        <div v-else-if="etapa === 'enviando'" class="tela__centro">
          <div class="spinner-border text-secondary mb-3"></div>
          <p class="tela__sub">Gravando o voto...</p>
        </div>

        <!-- Fim -->
        <div v-else-if="etapa === 'fim'" class="tela__centro">
          <p class="tela__fim">FIM</p>
          <p class="tela__votou">VOTOU</p>
        </div>

        <!-- Votação -->
        <div v-else class="cedula">
          <div class="cedula__conteudo">
            <div class="cedula__dados">
              <p class="cedula__rotulo">SEU VOTO PARA</p>
              <p class="cedula__cargo">{{ eleicao?.descricao }}</p>

              <template v-if="branco">
                <p class="cedula__destaque">VOTO EM BRANCO</p>
              </template>

              <template v-else>
                <div class="cedula__numero">
                  <span>Número:</span>
                  <span
                    v-for="i in totalDigitos"
                    :key="i"
                    :class="['digito', { 'digito--atual': i === digitos.length + 1 }]"
                  >{{ digitos[i - 1] ?? '' }}</span>
                </div>

                <p v-if="candidato" class="cedula__nome">
                  Nome: <strong>{{ candidato.descricao }}</strong>
                </p>

                <template v-if="nulo">
                  <p class="cedula__aviso">NÚMERO ERRADO</p>
                  <p class="cedula__destaque cedula__destaque--piscando">VOTO NULO</p>
                </template>
              </template>
            </div>

            <div v-if="candidato" class="cedula__foto">
              <img v-if="candidato.foto" :src="fotoUrl(candidato.foto)" :alt="candidato.descricao" />
              <div v-else class="cedula__foto-vazia"><i class="bi bi-person-fill"></i></div>
              <span>Candidato</span>
            </div>
          </div>

          <div v-if="podeConfirmar" class="cedula__rodape">
            <p class="mb-1">Aperte a tecla:</p>
            <p class="mb-0"><strong>CONFIRMA</strong> para CONFIRMAR este voto</p>
            <p class="mb-0"><strong>CORRIGE</strong> para REINICIAR este voto</p>
          </div>
        </div>
      </div>

      <!-- Teclado -->
      <div class="teclado">
        <div class="teclado__numeros">
          <button v-for="n in teclas" :key="n" class="tecla" @click="digitar(n)">{{ n }}</button>
          <button class="tecla tecla--zero" @click="digitar(0)">0</button>
        </div>
        <div class="teclado__acoes">
          <button class="tecla-acao tecla-acao--branco" @click="votoBranco">BRANCO</button>
          <button class="tecla-acao tecla-acao--corrige" @click="corrige()">CORRIGE</button>
          <button class="tecla-acao tecla-acao--confirma" @click="confirma">CONFIRMA</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.urna {
  background: linear-gradient(180deg, var(--urna-corpo) 0%, var(--urna-corpo-sombra) 100%);
  border-radius: 22px;
  padding: 18px 22px 26px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, .55), inset 0 2px 0 rgba(255, 255, 255, .6);
  width: 100%;
  max-width: 1040px;
}

.urna__topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.urna__logo {
  height: 30px;
}

.urna__identificacao {
  font-size: .8rem;
  font-weight: 600;
  color: #5d5848;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.urna__corpo {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 22px;
}

@media (max-width: 860px) {
  .urna__corpo {
    grid-template-columns: 1fr;
  }
}

/* ── Tela ─────────────────────────────────────────── */
.tela {
  background: var(--urna-tela);
  border: 12px solid #2b2b2b;
  border-radius: 10px;
  min-height: 400px;
  box-shadow: inset 0 0 18px rgba(0, 0, 0, .25);
  display: flex;
  color: #111;
  font-family: Arial, Helvetica, sans-serif;
}

.tela__centro {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
}

.tela__icone {
  font-size: 3rem;
  color: #777;
  margin-bottom: 12px;
}

.tela__titulo {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.tela__sub {
  font-size: 1.1rem;
  color: #555;
  margin: 0;
}

.tela__fim {
  font-size: 7rem;
  font-weight: 800;
  letter-spacing: 6px;
  line-height: 1;
  margin: 0;
}

.tela__votou {
  font-size: 1.2rem;
  color: #666;
  letter-spacing: 4px;
  margin: 8px 0 0;
}

/* ── Cédula ───────────────────────────────────────── */
.cedula {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 18px 22px 0;
}

.cedula__conteudo {
  flex: 1;
  display: flex;
  gap: 16px;
}

.cedula__dados {
  flex: 1;
}

.cedula__rotulo {
  font-size: .95rem;
  margin-bottom: 4px;
}

.cedula__cargo {
  font-size: 1.7rem;
  font-weight: 700;
  margin-bottom: 26px;
}

.cedula__numero {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  margin-bottom: 18px;
}

.digito {
  width: 42px;
  height: 52px;
  border: 2px solid #333;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  background: #fff;
}

.digito--atual {
  animation: piscar 1s steps(1) infinite;
}

.cedula__nome {
  font-size: 1.25rem;
  margin-bottom: 8px;
}

.cedula__aviso {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 10px 0 4px;
}

.cedula__destaque {
  font-size: 2.6rem;
  font-weight: 800;
  margin-top: 24px;
}

.cedula__destaque--piscando {
  margin-top: 4px;
  animation: piscar 1s steps(1) infinite;
}

.cedula__foto {
  width: 140px;
  text-align: center;
  font-size: .85rem;
}

.cedula__foto img,
.cedula__foto-vazia {
  width: 140px;
  height: 170px;
  object-fit: cover;
  border: 2px solid #333;
  display: block;
  margin-bottom: 4px;
  background: #ddd;
}

.cedula__foto-vazia {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  color: #999;
}

.cedula__rodape {
  border-top: 2px solid #333;
  margin: 12px -22px 0;
  padding: 8px 22px 12px;
  font-size: .95rem;
}

@keyframes piscar {
  50% { opacity: 0; }
}

/* ── Teclado ──────────────────────────────────────── */
.teclado {
  background: var(--urna-teclado);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, .6);
}

.teclado__numeros {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.tecla {
  background: var(--urna-tecla);
  color: #fff;
  border: none;
  border-radius: 6px;
  height: 54px;
  font-size: 1.6rem;
  font-weight: 700;
  box-shadow: 0 4px 0 #000, inset 0 1px 0 rgba(255, 255, 255, .12);
  transition: transform .05s, box-shadow .05s;
}

.tecla--zero {
  grid-column: 2;
}

.teclado__acoes {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr;
  gap: 10px;
  align-items: end;
}

.tecla-acao {
  border: none;
  border-radius: 6px;
  height: 52px;
  font-size: .78rem;
  font-weight: 800;
  letter-spacing: .5px;
  box-shadow: 0 4px 0 rgba(0, 0, 0, .55);
  transition: transform .05s, box-shadow .05s;
}

.tecla-acao--branco   { background: var(--urna-branco); color: #111; }
.tecla-acao--corrige  { background: var(--urna-corrige); color: #111; }
.tecla-acao--confirma { background: var(--urna-confirma); color: #111; height: 64px; }

.tecla:active,
.tecla-acao:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #000;
}
</style>
