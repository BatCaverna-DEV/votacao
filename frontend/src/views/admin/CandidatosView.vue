<template>
  <div>
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h5 class="fw-bold mb-0">Candidatos</h5>
        <p class="text-muted small mb-0">Gerencie os candidatos das eleições</p>
      </div>
      <button class="btn btn-primary d-flex align-items-center gap-2" @click="abrirModal()">
        <i class="bi bi-plus-lg"></i> Novo Candidato
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
              <input v-model="busca" type="text" class="form-control border-start-0" placeholder="Buscar candidato..." />
            </div>
          </div>
          <div class="col-auto">
            <select v-model="filtroEleicao" class="form-select form-select-sm">
              <option value="">Todas as eleições</option>
              <option v-for="e in eleicoes" :key="e.id" :value="e.id">{{ e.descricao }}</option>
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
          Nenhum candidato encontrado
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="small fw-semibold ps-4">Foto</th>
                <th class="small fw-semibold">Nº</th>
                <th class="small fw-semibold">Descrição</th>
                <th class="small fw-semibold">Eleição</th>
                <th class="small fw-semibold text-end pe-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in listaFiltrada" :key="item.id">
                <td class="ps-4">
                  <img v-if="item.foto" :src="fotoUrl(item.foto)" class="foto-thumb" alt="Foto" />
                  <div v-else class="foto-placeholder"><i class="bi bi-person-fill"></i></div>
                </td>
                <td><span class="badge bg-primary-subtle text-primary fw-bold">{{ item.numero }}</span></td>
                <td class="fw-semibold small">{{ item.descricao }}</td>
                <td class="small text-muted">{{ item.eleicao?.descricao || '—' }}</td>
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
            <h5 class="modal-title fw-bold">{{ modoEdicao ? 'Editar Candidato' : 'Novo Candidato' }}</h5>
            <button type="button" class="btn-close" @click="fecharModal"></button>
          </div>
          <form @submit.prevent="salvar" enctype="multipart/form-data">
            <div class="modal-body">
              <div v-if="erroModal" class="alert alert-danger py-2 small">{{ erroModal }}</div>

              <div class="mb-3">
                <label class="form-label small fw-semibold">Eleição <span class="text-danger">*</span></label>
                <select v-model="form.eleicoes_id" class="form-select" required>
                  <option value="">Selecione uma eleição</option>
                  <option v-for="e in eleicoes" :key="e.id" :value="e.id">{{ e.descricao }}</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label small fw-semibold">Número <span class="text-danger">*</span></label>
                <input v-model.number="form.numero" type="number" min="1" class="form-control" required />
              </div>

              <div class="mb-3">
                <label class="form-label small fw-semibold">Descrição / Nome</label>
                <input v-model="form.descricao" type="text" class="form-control" maxlength="100" />
              </div>

              <div class="mb-1">
                <label class="form-label small fw-semibold">Foto</label>
                <div class="d-flex align-items-center gap-3">
                  <div class="foto-preview-wrap">
                    <img v-if="fotoPreview" :src="fotoPreview" class="foto-preview" alt="Preview" />
                    <div v-else class="foto-preview foto-preview--empty">
                      <i class="bi bi-person-fill fs-3 text-muted"></i>
                    </div>
                  </div>
                  <div class="flex-grow-1">
                    <input ref="inputFotoEl" type="file" accept="image/*" class="form-control form-control-sm" @change="onFotoChange" />
                    <div class="form-text">JPG, PNG ou WEBP — máx. 2 MB</div>
                    <button v-if="fotoPreview && modoEdicao" type="button" class="btn btn-sm btn-link text-danger p-0 mt-1" @click="removerFoto">
                      <i class="bi bi-x-circle me-1"></i>Remover foto
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="fecharModal">Cancelar</button>
              <button type="submit" class="btn btn-primary d-flex align-items-center gap-2" :disabled="salvando">
                <span v-if="salvando" class="spinner-border spinner-border-sm"></span>
                {{ modoEdicao ? 'Salvar alterações' : 'Criar candidato' }}
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
            <h6 class="modal-title fw-bold">Excluir candidato</h6>
            <button type="button" class="btn-close" @click="fecharModalExcluir"></button>
          </div>
          <div class="modal-body pt-2">
            <p class="small mb-0">Tem certeza que deseja excluir <strong>{{ itemParaExcluir?.descricao }}</strong>? Esta ação não pode ser desfeita.</p>
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
import { fotoUrl } from '../../utils/uploads.js'

const lista = ref([])
const eleicoes = ref([])
const loading = ref(true)
const busca = ref('')
const filtroEleicao = ref('')
const alerta = ref({ mensagem: '', tipo: 'success' })

const modalEl = ref(null)
const modalExcluirEl = ref(null)
const inputFotoEl = ref(null)
let bsModal = null
let bsModalExcluir = null

const modoEdicao = ref(false)
const salvando = ref(false)
const erroModal = ref('')
const form = ref({ id: null, descricao: '', numero: '', eleicoes_id: '' })
const fotoArquivo = ref(null)
const fotoPreview = ref('')
const removerFotoFlag = ref(false)

const itemParaExcluir = ref(null)
const excluindo = ref(false)

const listaFiltrada = computed(() =>
  lista.value.filter(c => {
    const matchBusca = !busca.value || c.descricao?.toLowerCase().includes(busca.value.toLowerCase())
    const matchEleicao = !filtroEleicao.value || c.eleicoes_id === filtroEleicao.value
    return matchBusca && matchEleicao
  })
)

function onFotoChange(e) {
  const file = e.target.files[0]
  if (!file) return
  fotoArquivo.value = file
  removerFotoFlag.value = false
  fotoPreview.value = URL.createObjectURL(file)
}

function removerFoto() {
  fotoArquivo.value = null
  fotoPreview.value = ''
  removerFotoFlag.value = true
  if (inputFotoEl.value) inputFotoEl.value.value = ''
}

function abrirModal(item = null) {
  erroModal.value = ''
  fotoArquivo.value = null
  removerFotoFlag.value = false
  if (item) {
    modoEdicao.value = true
    form.value = { id: item.id, descricao: item.descricao, numero: item.numero, eleicoes_id: item.eleicoes_id }
    fotoPreview.value = item.foto || ''
  } else {
    modoEdicao.value = false
    form.value = { id: null, descricao: '', numero: '', eleicoes_id: '' }
    fotoPreview.value = ''
  }
  if (inputFotoEl.value) inputFotoEl.value.value = ''
  bsModal.show()
}

function fecharModal() { bsModal.hide() }

async function salvar() {
  erroModal.value = ''
  salvando.value = true
  try {
    const fd = new FormData()
    fd.append('descricao', form.value.descricao || '')
    fd.append('numero', form.value.numero)
    fd.append('eleicoes_id', form.value.eleicoes_id)
    if (fotoArquivo.value) fd.append('foto', fotoArquivo.value)
    if (removerFotoFlag.value) fd.append('removerFoto', '1')

    if (modoEdicao.value) {
      const { data } = await api.put(`/candidatos/${form.value.id}`, fd)
      const idx = lista.value.findIndex(c => c.id === form.value.id)
      if (idx !== -1) lista.value[idx] = { ...lista.value[idx], ...data.data }
      mostrarAlerta('Candidato atualizado com sucesso.', 'success')
    } else {
      const { data } = await api.post('/candidatos', fd)
      const detalhe = await api.get(`/candidatos/${data.data.id}`)
      lista.value.unshift(detalhe.data.data)
      mostrarAlerta('Candidato criado com sucesso.', 'success')
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
    await api.delete(`/candidatos/${itemParaExcluir.value.id}`)
    lista.value = lista.value.filter(c => c.id !== itemParaExcluir.value.id)
    mostrarAlerta('Candidato excluído com sucesso.', 'success')
    fecharModalExcluir()
  } catch (err) {
    mostrarAlerta(err.response?.data?.message || 'Erro ao excluir candidato.', 'danger')
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
    const [resCandidatos, resEleicoes] = await Promise.all([
      api.get('/candidatos'),
      api.get('/eleicoes'),
    ])
    lista.value = resCandidatos.data.data || []
    eleicoes.value = resEleicoes.data.data || []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.foto-thumb {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #dee2e6;
}

.foto-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #adb5bd;
  font-size: 1rem;
}

.foto-preview-wrap {
  flex-shrink: 0;
}

.foto-preview {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #dee2e6;
  display: block;
}

.foto-preview--empty {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
