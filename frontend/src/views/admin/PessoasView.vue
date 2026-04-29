<template>
  <div>
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h5 class="fw-bold mb-0">Pessoas</h5>
        <p class="text-muted small mb-0">Gerencie o cadastro de pessoas</p>
      </div>
      <button class="btn btn-primary d-flex align-items-center gap-2" @click="abrirModal()">
        <i class="bi bi-plus-lg"></i> Nova Pessoa
      </button>
    </div>

    <div v-if="alerta.mensagem" :class="['alert alert-dismissible fade show', `alert-${alerta.tipo}`]" role="alert">
      {{ alerta.mensagem }}
      <button type="button" class="btn-close" @click="alerta.mensagem = ''"></button>
    </div>

    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body py-2">
        <div class="input-group input-group-sm" style="max-width: 380px">
          <span class="input-group-text bg-light border-end-0"><i class="bi bi-search text-muted"></i></span>
          <input v-model="busca" type="text" class="form-control border-start-0" placeholder="Buscar por nome ou matrícula..." />
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        <div v-if="loading" class="p-4">
          <div v-for="n in 4" :key="n" class="placeholder-glow mb-3">
            <span class="placeholder col-12 rounded" style="height:36px"></span>
          </div>
        </div>
        <div v-else-if="listaFiltrada.length === 0" class="text-center py-5 text-muted">
          <i class="bi bi-inbox fs-2 d-block mb-2"></i>
          Nenhuma pessoa encontrada
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="small fw-semibold ps-4">Nome</th>
                <th class="small fw-semibold">Matrícula</th>
                <th class="small fw-semibold">Email</th>
                <th class="small fw-semibold">Curso</th>
                <th class="small fw-semibold">Usuário</th>
                <th class="small fw-semibold text-end pe-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in listaFiltrada" :key="item.id">
                <td class="ps-4 fw-semibold small">{{ item.nome || '—' }}</td>
                <td class="small text-muted">{{ item.matricula || '—' }}</td>
                <td class="small text-muted">{{ item.email || '—' }}</td>
                <td class="small text-muted">{{ item.curso || '—' }}</td>
                <td class="small text-muted">{{ item.usuario?.username || '—' }}</td>
                <td class="text-end pe-4">
                  <button class="btn btn-sm btn-outline-secondary me-1" title="Editar" @click="abrirModal(item)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" title="Excluir" @click="confirmarExclusao(item)">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Criar / Editar -->
    <div class="modal fade" tabindex="-1" ref="modalEl">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ modoEdicao ? 'Editar Pessoa' : 'Nova Pessoa' }}</h5>
            <button type="button" class="btn-close" @click="fecharModal"></button>
          </div>
          <form @submit.prevent="salvar">
            <div class="modal-body">
              <div v-if="erroModal" class="alert alert-danger py-2 small">{{ erroModal }}</div>

              <div class="mb-3">
                <label class="form-label small fw-semibold">Usuário vinculado <span class="text-danger">*</span></label>
                <select v-model="form.usuarios_id" class="form-select" required>
                  <option value="">Selecione um usuário</option>
                  <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.username }}</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label small fw-semibold">Nome completo</label>
                <input v-model="form.nome" type="text" class="form-control" maxlength="100" />
              </div>

              <div class="row g-3 mb-3">
                <div class="col-6">
                  <label class="form-label small fw-semibold">Matrícula</label>
                  <input v-model="form.matricula" type="text" class="form-control" maxlength="45" />
                </div>
                <div class="col-6">
                  <label class="form-label small fw-semibold">Curso</label>
                  <input v-model="form.curso" type="text" class="form-control" maxlength="100" />
                </div>
              </div>

              <div class="mb-1">
                <label class="form-label small fw-semibold">Email</label>
                <input v-model="form.email" type="email" class="form-control" maxlength="100" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="fecharModal">Cancelar</button>
              <button type="submit" class="btn btn-primary d-flex align-items-center gap-2" :disabled="salvando">
                <span v-if="salvando" class="spinner-border spinner-border-sm"></span>
                {{ modoEdicao ? 'Salvar alterações' : 'Criar pessoa' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Excluir -->
    <div class="modal fade" tabindex="-1" ref="modalExcluirEl">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <h6 class="modal-title fw-bold">Excluir pessoa</h6>
            <button type="button" class="btn-close" @click="fecharModalExcluir"></button>
          </div>
          <div class="modal-body pt-2">
            <p class="small mb-0">Tem certeza que deseja excluir <strong>{{ itemParaExcluir?.nome }}</strong>? Esta ação não pode ser desfeita.</p>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary btn-sm" @click="fecharModalExcluir">Cancelar</button>
            <button type="button" class="btn btn-danger btn-sm d-flex align-items-center gap-2" @click="excluir" :disabled="excluindo">
              <span v-if="excluindo" class="spinner-border spinner-border-sm"></span>
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Modal } from 'bootstrap'
import api from '../../services/api.js'

const lista = ref([])
const usuarios = ref([])
const loading = ref(true)
const busca = ref('')
const alerta = ref({ mensagem: '', tipo: 'success' })

const modalEl = ref(null)
const modalExcluirEl = ref(null)
let bsModal = null
let bsModalExcluir = null

const modoEdicao = ref(false)
const salvando = ref(false)
const erroModal = ref('')
const form = ref({ id: null, nome: '', matricula: '', email: '', curso: '', usuarios_id: '' })

const itemParaExcluir = ref(null)
const excluindo = ref(false)

const listaFiltrada = computed(() =>
  lista.value.filter(p =>
    !busca.value ||
    p.nome?.toLowerCase().includes(busca.value.toLowerCase()) ||
    p.matricula?.toLowerCase().includes(busca.value.toLowerCase())
  )
)

function abrirModal(item = null) {
  erroModal.value = ''
  if (item) {
    modoEdicao.value = true
    form.value = { id: item.id, nome: item.nome, matricula: item.matricula, email: item.email, curso: item.curso, usuarios_id: item.usuarios_id }
  } else {
    modoEdicao.value = false
    form.value = { id: null, nome: '', matricula: '', email: '', curso: '', usuarios_id: '' }
  }
  bsModal.show()
}

function fecharModal() { bsModal.hide() }

async function salvar() {
  erroModal.value = ''
  salvando.value = true
  try {
    const payload = { nome: form.value.nome, matricula: form.value.matricula, email: form.value.email, curso: form.value.curso, usuarios_id: form.value.usuarios_id }
    if (modoEdicao.value) {
      const { data } = await api.put(`/pessoas/${form.value.id}`, payload)
      const idx = lista.value.findIndex(p => p.id === form.value.id)
      if (idx !== -1) {
        const usuarioVinculado = usuarios.value.find(u => u.id === payload.usuarios_id)
        lista.value[idx] = { ...lista.value[idx], ...data.data, usuario: usuarioVinculado }
      }
      mostrarAlerta('Pessoa atualizada com sucesso.', 'success')
    } else {
      const { data } = await api.post('/pessoas', payload)
      const detalhe = await api.get(`/pessoas/${data.data.id}`)
      lista.value.unshift(detalhe.data.data)
      mostrarAlerta('Pessoa criada com sucesso.', 'success')
    }
    fecharModal()
  } catch (err) {
    erroModal.value = err.response?.data?.message || 'Ocorreu um erro. Tente novamente.'
  } finally {
    salvando.value = false
  }
}

function confirmarExclusao(item) {
  itemParaExcluir.value = item
  bsModalExcluir.show()
}

function fecharModalExcluir() { bsModalExcluir.hide() }

async function excluir() {
  excluindo.value = true
  try {
    await api.delete(`/pessoas/${itemParaExcluir.value.id}`)
    lista.value = lista.value.filter(p => p.id !== itemParaExcluir.value.id)
    mostrarAlerta('Pessoa excluída com sucesso.', 'success')
    fecharModalExcluir()
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao excluir pessoa.', 'danger')
    fecharModalExcluir()
  } finally {
    excluindo.value = false
  }
}

function mostrarAlerta(mensagem, tipo) {
  alerta.value = { mensagem, tipo }
  setTimeout(() => { alerta.value.mensagem = '' }, 4000)
}

onMounted(async () => {
  bsModal = new Modal(modalEl.value)
  bsModalExcluir = new Modal(modalExcluirEl.value)
  try {
    const [resPessoas, resUsuarios] = await Promise.all([
      api.get('/pessoas'),
      api.get('/usuarios'),
    ])
    lista.value = resPessoas.data.data || []
    usuarios.value = resUsuarios.data.data || []
  } finally {
    loading.value = false
  }
})
</script>
