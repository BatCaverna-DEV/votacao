<template>
  <!-- Overlay mobile -->
  <div v-if="aberto" class="sidebar-overlay d-lg-none" @click="$emit('fechar')"></div>

  <aside :class="['sidebar', { 'sidebar--open': aberto }]">
    <!-- Brand -->
    <div class="sidebar-brand">
      <div class="sidebar-brand__icon">
        <i class="bi bi-check2-circle"></i>
      </div>
      <span class="sidebar-brand__text">Votação</span>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <p class="sidebar-nav__label">Principal</p>
      <RouterLink
        v-for="item in navPrincipal"
        :key="item.to"
        :to="item.to"
        class="sidebar-nav__item"
        active-class="sidebar-nav__item--active"
        @click="$emit('fechar')"
      >
        <i :class="['bi', item.icon]"></i>
        <span>{{ item.label }}</span>
      </RouterLink>

      <p class="sidebar-nav__label mt-3">Cadastros</p>
      <RouterLink
        v-for="item in navCadastros"
        :key="item.to"
        :to="item.to"
        class="sidebar-nav__item"
        active-class="sidebar-nav__item--active"
        @click="$emit('fechar')"
      >
        <i :class="['bi', item.icon]"></i>
        <span>{{ item.label }}</span>
      </RouterLink>

    </nav>

    <!-- Logout -->
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-user__avatar">
          {{ iniciais }}
        </div>
        <div class="sidebar-user__info">
          <span class="sidebar-user__name">{{ auth.usuario?.username }}</span>
          <span class="sidebar-user__role">Administrador</span>
        </div>
      </div>
      <button class="sidebar-logout" @click="handleLogout" title="Sair">
        <i class="bi bi-box-arrow-right"></i>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

defineProps({ aberto: Boolean })
defineEmits(['fechar'])

const auth = useAuthStore()
const router = useRouter()

const navPrincipal = [
  { to: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
  { to: '/eleicoes',  icon: 'bi-ballot',       label: 'Eleições' },
]

const navCadastros = [
  { to: '/usuarios',   icon: 'bi-person-gear',       label: 'Usuários' },
  { to: '/pessoas',    icon: 'bi-person-lines-fill',  label: 'Pessoas' },
]

const iniciais = computed(() => {
  const u = auth.usuario?.username || ''
  return u.slice(0, 2).toUpperCase()
})

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 250px;
  background: #0f1c2e;
  display: flex;
  flex-direction: column;
  z-index: 1040;
  transition: transform 0.25s ease;
}

/* Mobile: oculto por padrão */
@media (max-width: 991.98px) {
  .sidebar {
    transform: translateX(-100%);
  }
  .sidebar--open {
    transform: translateX(0);
  }
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1039;
}

/* Brand */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.sidebar-brand__icon {
  width: 38px;
  height: 38px;
  background: #0d6efd;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  flex-shrink: 0;
}

.sidebar-brand__text {
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  letter-spacing: 0.5px;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
}

.sidebar-nav__label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: rgba(255,255,255,0.35);
  padding: 0 8px;
  margin-bottom: 4px;
}

.sidebar-nav__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  color: rgba(255,255,255,0.65);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.15s ease;
  margin-bottom: 2px;
}

.sidebar-nav__item:hover {
  background: rgba(255,255,255,0.08);
  color: white;
}

.sidebar-nav__item--active {
  background: rgba(13,110,253,0.25);
  color: #6ea8fe;
  font-weight: 600;
}

.sidebar-nav__item--active i {
  color: #0d6efd;
}

.sidebar-nav__item i {
  font-size: 1rem;
  width: 20px;
  text-align: center;
}

/* Footer */
.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.sidebar-user__avatar {
  width: 34px;
  height: 34px;
  background: #0d6efd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.sidebar-user__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sidebar-user__name {
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-user__role {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.4);
}

.sidebar-logout {
  background: none;
  border: none;
  color: rgba(255,255,255,0.4);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.15s;
  flex-shrink: 0;
}

.sidebar-logout:hover {
  background: rgba(220,53,69,0.2);
  color: #f87171;
}
</style>
