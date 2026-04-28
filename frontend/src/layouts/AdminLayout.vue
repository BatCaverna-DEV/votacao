<template>
  <div class="admin-layout">
    <AppSidebar :aberto="sidebarAberta" @fechar="sidebarAberta = false" />

    <div class="admin-main">
      <AppNavbar @toggleSidebar="sidebarAberta = !sidebarAberta" />
      <main class="admin-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppSidebar from '../components/layout/AppSidebar.vue'
import AppNavbar from '../components/layout/AppNavbar.vue'

const sidebarAberta = ref(false)
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f4f6f9;
}

.admin-main {
  margin-left: 250px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-content {
  flex: 1;
  padding: 28px;
  overflow-y: auto;
}

@media (max-width: 991.98px) {
  .admin-main {
    margin-left: 0;
  }
}
</style>
