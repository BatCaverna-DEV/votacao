<template>
  <header class="app-navbar">
    <!-- Toggle sidebar (mobile) -->
    <button class="navbar-toggle d-lg-none" @click="$emit('toggleSidebar')">
      <i class="bi bi-list"></i>
    </button>

    <!-- Breadcrumb -->
    <nav class="d-none d-md-block">
      <ol class="breadcrumb mb-0">
        <li class="breadcrumb-item">
          <RouterLink to="/dashboard" class="text-decoration-none text-muted small">Início</RouterLink>
        </li>
        <li class="breadcrumb-item active small">{{ paginaAtual }}</li>
      </ol>
    </nav>

    <div class="navbar-right">
      <!-- Dropdown do usuário -->
      <div class="position-relative" ref="dropdownRef">
        <button class="user-btn dropdown-toggle" @click="showDropdown = !showDropdown">
          <div class="user-avatar">{{ iniciais }}</div>
          <span class="d-none d-md-inline">{{ auth.usuario?.username }}</span>
        </button>
        <ul v-show="showDropdown" class="dropdown-menu dropdown-menu-end shadow border-0 show" style="top:100%;right:0">
          <li>
            <span class="dropdown-item-text small text-muted">
              <i class="bi bi-shield-check me-1 text-primary"></i> Administrador
            </span>
          </li>
          <li><hr class="dropdown-divider my-1"></li>
          <li>
            <button class="dropdown-item small text-danger" @click="handleLogout">
              <i class="bi bi-box-arrow-right me-2"></i>Sair
            </button>
          </li>
        </ul>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

defineEmits(['toggleSidebar'])

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const showDropdown = ref(false)
const dropdownRef = ref(null)

const paginaAtual = computed(() => route.name || 'Dashboard')

const iniciais = computed(() => {
  const u = auth.usuario?.username || ''
  return u.slice(0, 2).toUpperCase()
})

function onClickOutside(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    showDropdown.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))

function handleLogout() {
  showDropdown.value = false
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-navbar {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-toggle {
  background: none;
  border: none;
  font-size: 1.4rem;
  color: #495057;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.navbar-toggle:hover {
  background: #f8f9fa;
}

.navbar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #495057;
  font-weight: 500;
  transition: all 0.15s;
}

.user-btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.user-btn::after {
  margin-left: 2px;
}

.user-avatar {
  width: 28px;
  height: 28px;
  background: #00A651;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
}

.dropdown-menu {
  min-width: 180px;
  border-radius: 10px;
  padding: 6px;
}

.dropdown-item {
  border-radius: 6px;
}
</style>
