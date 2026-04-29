<template>
  <div>
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h5 class="fw-bold mb-0">Usuários</h5>
        <p class="text-muted small mb-0">Gerencie os usuários do sistema</p>
      </div>
      <button class="btn btn-primary d-flex align-items-center gap-2" @click="abrirModal()">
        <i class="bi bi-plus-lg"></i> Novo Usuário
      </button>
    </div>

    <div v-if="alerta.mensagem" :class="['alert alert-dismissible fade show', `alert-${alerta.tipo}`]" role="alert">
      {{ alerta.mensagem }}
      <button type="button" class="btn-close" @click="alerta.mensagem = ''"></button>
    </div>

    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body py-2">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-md-5">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light border-end-0"><i class="bi bi-search text-muted"></i></span>
              <input v-model="busca" type="text" class="form-control border-start-0" placeholder="Buscar usuário..." />
            </div>
          </div>
          <div class="col-auto">
            <select v-model="filtroCategoria" class="form-select form-select-sm">
              <option value="">Todas as categorias</option>
              <option value="1">Admin</option>
              <option value="2">Eleitor</option>
            </select>
          </div>
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
          Nenhum usuário encontrado
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="small fw-semibold ps-4">Username</th>
                <th class="small fw-semibold">Categoria</th>
                <th class="small fw-semibold text-end pe-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in listaFiltrada" :key="item.id">
                <td class="ps-4">
                  <div class="d-flex align-items-center gap-2">
                    <div class="avatar-sm">{{ item.username?.slice(0, 2).toUpperCase() }}</div>
                    <span class="fw-semibold small">{{ item.username }}</span>
                  </div>
                </td>
                <td>
                  <span :class="['badge rounded-pill', item.categoria === 1 ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary']">
                    {{ item.categoria === 1 ? 'Admin' : 'Eleitor' }}
                  </span>
                </td>
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
            <h5 class="modal-title fw-bold">{{ modoEdicao ? 'Editar Usuário' : 'Novo Usuário' }}</h5>
            <button type="button" class="btn-close" @click="fecharModal"></button>
          </div>
          <form @submit.prevent="salvar">
            <div class="modal-body">
              <div v-if="erroModal" class="alert alert-danger py-2 small">{{ erroModal }}</div>

              <div class="mb-3">
                <label class="form-label small fw-semibold">Username <span class="text-danger">*</span></label>
                <input v-model="form.username" type="text" class="form-control" maxlength="45" required />
              </div>

              <div class="mb-3">
                <label class="form-label small fw-semibold">
                  Senha <span v-if="!modoEdicao" class="text-danger">*</span>
                  <span v-else class="text-muted fw-normal">(deixe em branco para manter)</span>
                </label>
                <div class="input-group">
                  <input v-model="form.password" :type="mostrarSenha ? 'text' : 'password'" class="form-control" :required="!modoEdicao" />
                  <button type="button" class="btn btn-outline-secondary" @click="mostrarSenha = !mostrarSenha">
                    <i :class="['bi', mostrarSenha ? 'bi-eye-slash' : 'bi-eye']"></i>
                  </button>
                </div>
              </div>

              <div class="mb-1">
                <label class="form-label small fw-semibold">Categoria <span class="text-danger">*</span></label>
                <select v-model="form.categoria" class="form-select" required>
                  <option :value="1">Admin</option>
                  <option :value="2">Eleitor</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="fecharModal">Cancelar</button>
              <button type="submit" class="btn btn-primary d-flex align-items-center gap-2" :disabled="salvando">
                <span v-if="salvando" class="spinner-border spinner-border-sm"></span>
                {{ modoEdicao ? 'Salvar alterações' : 'Criar usuário' }}
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
            <h6 class="modal-title fw-bold">Excluir usuário</h6>
            <button type="button" class="btn-close" @click="fecharModalExcluir"></button>
          </div>
          <div class="modal-body pt-2">
            <p class="small mb-0">Tem certeza que deseja excluir <strong>{{ itemParaExcluir?.username }}</strong>? Esta ação não pode ser desfeita.</p>
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
const loading = ref(true)
const busca = ref('')
const filtroCategoria = ref('')
const alerta = ref({ mensagem: '', tipo: 'success' })
const mostrarSenha = ref(false)

const modalEl = ref(null)
const modalExcluirEl = ref(null)
let bsModal = null
let bsModalExcluir = null

const modoEdicao = ref(false)
const salvando = ref(false)
const erroModal = ref('')
const form = ref({ id: null, username: '', password: '', categoria: 2 })

const itemParaExcluir = ref(null)
const excluindo = ref(false)

const listaFiltrada = computed(() =>
  lista.value.filter(u => {
    const matchBusca = !busca.value || u.username?.toLowerCase().includes(busca.value.toLowerCase())
    const matchCategoria = filtroCategoria.value === '' || String(u.categoria) === filtroCategoria.value
    return matchBusca && matchCategoria
  })
)

function abrirModal(item = null) {
  erroModal.value = ''
  mostrarSenha.value = false
  if (item) {
    modoEdicao.value = true
    form.value = { id: item.id, username: item.username, password: '', categoria: item.categoria }
  } else {
    modoEdicao.value = false
    form.value = { id: null, username: '', password: '', categoria: 2 }
  }
  bsModal.show()
}

function fecharModal() { bsModal.hide() }

async function salvar() {
  erroModal.value = ''
  salvando.value = true
  try {
    if (modoEdicao.value) {
      const payload = { username: form.value.username, categoria: form.value.categoria }
      if (form.value.password) payload.password = form.value.password
      const { data } = await api.put(`/usuarios/${form.value.id}`, payload)
      const idx = lista.value.findIndex(u => u.id === form.value.id)
      if (idx !== -1) lista.value[idx] = { ...lista.value[idx], ...data.data }
      mostrarAlerta('Usuário atualizado com sucesso.', 'success')
    } else {
      const { data } = await api.post('/usuarios', form.value)
      lista.value.unshift(data.data)
      mostrarAlerta('Usuário criado com sucesso.', 'success')
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
    await api.delete(`/usuarios/${itemParaExcluir.value.id}`)
    lista.value = lista.value.filter(u => u.id !== itemParaExcluir.value.id)
    mostrarAlerta('Usuário excluído com sucesso.', 'success')
    fecharModalExcluir()
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao excluir usuário.', 'danger')
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
    const { data } = await api.get('/usuarios')
    lista.value = data.data || []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.avatar-sm {
  width: 30px;
  height: 30px;
  background: #0d6efd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}
</style>
