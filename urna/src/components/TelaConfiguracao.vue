<script setup>
import { ref } from 'vue'
import api, { mensagemErro } from '../services/api.js'

const emit = defineEmits(['conectado'])

const urnaId = ref('')
const conectando = ref(false)
const erro = ref('')

async function conectar() {
  erro.value = ''
  conectando.value = true
  try {
    const { data } = await api.post('/votacao/conectar', { urnas_id: urnaId.value.trim() })
    emit('conectado', urnaId.value.trim(), data.data)
  } catch (err) {
    erro.value = mensagemErro(err)
  } finally {
    conectando.value = false
  }
}
</script>

<template>
  <div class="card border-0 shadow-lg configuracao">
    <div class="card-body p-5">
      <div class="text-center mb-4">
        <img src="@/assets/logo.svg" alt="VotaIF" class="configuracao__logo mb-3" />
        <h5 class="fw-bold mb-1">Configurar urna</h5>
        <p class="text-muted small mb-0">
          Informe o ID da urna, que aparece na tela da eleição no sistema de gerenciamento.
        </p>
      </div>

      <div v-if="erro" class="alert alert-danger py-2 small">
        <i class="bi bi-exclamation-triangle-fill me-1"></i>{{ erro }}
      </div>

      <form @submit.prevent="conectar">
        <label class="form-label small fw-semibold">ID da urna</label>
        <input
          v-model="urnaId"
          type="text"
          class="form-control font-monospace mb-3"
          placeholder="00000000-0000-0000-0000-000000000000"
          :disabled="conectando"
          required
          autofocus
        />
        <button type="submit" class="btn btn-primary w-100 fw-semibold" :disabled="conectando">
          <span v-if="conectando" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="bi bi-plug-fill me-2"></i>
          Conectar
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.configuracao {
  width: 100%;
  max-width: 460px;
  border-radius: 16px;
}

.configuracao__logo {
  height: 48px;
}
</style>
