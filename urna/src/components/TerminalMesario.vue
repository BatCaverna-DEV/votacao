<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  etapa: { type: String, required: true },
  eleitor: { type: Object, default: null },
  liberando: { type: Boolean, default: false },
  mensagem: { type: Object, default: () => ({ texto: '', tipo: 'info' }) },
})
const emit = defineEmits(['liberar', 'cancelar', 'desconectar'])

const matricula = ref('')
const inputEl = ref(null)

// Volta o foco para a matrícula sempre que a urna fica livre
watch(() => props.etapa, (etapa) => {
  if (etapa === 'bloqueada') {
    matricula.value = ''
    setTimeout(() => inputEl.value?.focus(), 50)
  }
})

function liberar() {
  if (!matricula.value.trim()) return
  emit('liberar', matricula.value.trim())
}

function desconectar() {
  if (window.confirm('Desconectar esta urna? Será preciso informar o ID novamente.')) emit('desconectar')
}
</script>

<template>
  <div class="mesario card border-0 shadow">
    <div class="card-body">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <h6 class="fw-bold mb-0"><i class="bi bi-person-badge me-2"></i>Terminal do mesário</h6>
        <button class="btn btn-sm btn-link text-muted p-0" title="Desconectar urna" @click="desconectar">
          <i class="bi bi-gear"></i>
        </button>
      </div>

      <div v-if="mensagem.texto" :class="['alert py-2 small mb-2', `alert-${mensagem.tipo}`]">
        {{ mensagem.texto }}
      </div>

      <form v-if="etapa === 'bloqueada'" class="d-flex gap-2" @submit.prevent="liberar">
        <input
          ref="inputEl"
          v-model="matricula"
          type="text"
          class="form-control"
          placeholder="Matrícula do eleitor"
          :disabled="liberando"
          autofocus
        />
        <button type="submit" class="btn btn-primary text-nowrap" :disabled="liberando || !matricula.trim()">
          <span v-if="liberando" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="bi bi-unlock-fill me-1"></i>
          Liberar urna
        </button>
      </form>

      <div v-else-if="etapa === 'votacao' && eleitor" class="d-flex align-items-center justify-content-between gap-2">
        <span class="small">
          <span class="badge bg-success me-2">Votando</span>
          {{ eleitor.nome }} <span class="text-muted">({{ eleitor.matricula }})</span>
        </span>
        <button class="btn btn-sm btn-outline-secondary" @click="emit('cancelar')">Cancelar</button>
      </div>

      <p v-else-if="etapa === 'aguardando'" class="small text-muted mb-0">
        A urna será liberada automaticamente quando a eleição for iniciada.
      </p>

      <p v-else-if="etapa === 'encerrada'" class="small text-muted mb-0">
        A eleição foi encerrada. Esta urna não recebe mais votos.
      </p>

      <p v-else class="small text-muted mb-0">Aguarde...</p>
    </div>
  </div>
</template>

<style scoped>
.mesario {
  width: 100%;
  max-width: 1040px;
  border-radius: 14px;
}
</style>
