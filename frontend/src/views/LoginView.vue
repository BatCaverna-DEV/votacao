<template>
  <div class="login-page d-flex align-items-center justify-content-center min-vh-100">
    <div class="login-card card shadow-lg border-0">
      <div class="card-body p-5">

        <!-- Logo / Título -->
        <div class="text-center mb-4">
          <img src="@/assets/logo.svg" alt="VotaIF" class="login-logo mb-3" />
          <p class="text-muted small mb-0">Campus Coelho Neto · IFMA</p>
          <p class="text-muted small">Acesse sua conta para continuar</p>
        </div>

        <!-- Alerta de erro -->
        <div v-if="erro" class="alert alert-danger alert-dismissible d-flex align-items-center py-2" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <span class="small">{{ erro }}</span>
          <button type="button" class="btn-close btn-close-sm ms-auto" @click="erro = null"></button>
        </div>

        <!-- Formulário -->
        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label class="form-label fw-semibold small">Usuário</label>
            <div class="input-group">
              <span class="input-group-text bg-light border-end-0">
                <i class="bi bi-person text-muted"></i>
              </span>
              <input
                v-model="form.username"
                type="text"
                class="form-control border-start-0 ps-0"
                placeholder="Digite seu usuário"
                autocomplete="username"
                :disabled="loading"
                required
              />
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label fw-semibold small">Senha</label>
            <div class="input-group">
              <span class="input-group-text bg-light border-end-0">
                <i class="bi bi-lock text-muted"></i>
              </span>
              <input
                v-model="form.password"
                :type="mostrarSenha ? 'text' : 'password'"
                class="form-control border-start-0 border-end-0 ps-0"
                placeholder="Digite sua senha"
                autocomplete="current-password"
                :disabled="loading"
                required
              />
              <button
                type="button"
                class="input-group-text bg-light border-start-0"
                @click="mostrarSenha = !mostrarSenha"
                tabindex="-1"
              >
                <i :class="mostrarSenha ? 'bi bi-eye-slash' : 'bi bi-eye'" class="text-muted"></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-primary w-100 py-2 fw-semibold"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-box-arrow-in-right me-2"></i>
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const erro = ref(null)
const mostrarSenha = ref(false)

async function handleLogin() {
  loading.value = true
  erro.value = null
  try {
    await auth.login(form.username, form.password)
    router.push('/admin/dashboard')
  } catch (e) {
    erro.value = e.response?.data?.message || 'Erro ao conectar com o servidor'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  background: linear-gradient(150deg, #004d2b 0%, #006B3C 45%, #00A651 100%);
  min-height: 100vh;
}

.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
}

.login-logo {
  height: 56px;
  width: auto;
}

.input-group-text {
  cursor: default;
}
</style>
