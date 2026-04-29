<template>
  <div class="votacao-layout">
    <header class="votacao-header">
      <div class="d-flex align-items-center gap-2">
        <div class="header-icon"><i class="bi bi-check2-circle"></i></div>
        <span class="header-brand">Sistema de Votação</span>
      </div>
      <div class="d-flex align-items-center gap-3">
        <span class="text-muted small">
          <i class="bi bi-person-circle me-1"></i>{{ auth.usuario?.username }}
        </span>
        <button class="btn btn-sm btn-outline-secondary" @click="sair">
          <i class="bi bi-box-arrow-right me-1"></i>Sair
        </button>
      </div>
    </header>

    <main class="votacao-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const auth = useAuthStore()
const router = useRouter()

function sair() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.votacao-layout {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.votacao-header {
  background: #fff;
  border-bottom: 1px solid #e9ecef;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}

.header-icon {
  width: 34px;
  height: 34px;
  background: #0d6efd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.1rem;
}

.header-brand {
  font-weight: 700;
  font-size: 1rem;
  color: #0f1c2e;
}

.votacao-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 16px;
}
</style>
