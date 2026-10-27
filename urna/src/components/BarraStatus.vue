<script setup>
defineProps({
  etapa: { type: String, required: true },
  eleitor: { type: Object, default: null },
  mensagem: { type: Object, default: () => ({ texto: '', tipo: 'info' }) },
})
const emit = defineEmits(['desconectar'])

function desconectar() {
  if (window.confirm('Desconectar esta urna? Será preciso informar o ID novamente.')) emit('desconectar')
}
</script>

<template>
  <div class="status card border-0 shadow">
    <div class="card-body">
      <div class="d-flex align-items-center justify-content-between gap-2">
        <span v-if="['votacao', 'enviando'].includes(etapa) && eleitor" class="small">
          <span class="badge bg-success me-2">Votando</span>
          {{ eleitor.nome }} <span class="text-muted">({{ eleitor.matricula }})</span>
        </span>

        <span v-else-if="etapa === 'bloqueada'" class="small text-muted">
          <span class="spinner-grow spinner-grow-sm text-primary me-2"></span>
          Aguardando o mesário liberar o próximo eleitor no sistema de gerenciamento.
        </span>

        <span v-else-if="etapa === 'aguardando'" class="small text-muted">
          A urna será liberada automaticamente quando a eleição for iniciada.
        </span>

        <span v-else-if="etapa === 'encerrada'" class="small text-muted">
          A eleição foi encerrada. Esta urna não recebe mais votos.
        </span>

        <span v-else class="small text-muted">Aguarde...</span>

        <button class="btn btn-sm btn-link text-muted p-0" title="Desconectar urna" @click="desconectar">
          <i class="bi bi-gear"></i>
        </button>
      </div>

      <div v-if="mensagem.texto" :class="['alert py-2 small mb-0 mt-2', `alert-${mensagem.tipo}`]">
        {{ mensagem.texto }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.status {
  width: 100%;
  max-width: 1040px;
  border-radius: 14px;
}
</style>
