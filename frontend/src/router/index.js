import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, adminOnly: true },
    children: [
      { path: '', redirect: '/dashboard' },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/admin/DashboardView.vue'),
      },
      {
        path: 'eleicoes',
        name: 'Eleicoes',
        component: () => import('../views/admin/EleicoesView.vue'),
      },
      {
        path: 'candidatos',
        name: 'Candidatos',
        component: () => import('../views/admin/CandidatosView.vue'),
      },
      {
        path: 'urnas',
        name: 'Urnas',
        component: () => import('../views/admin/UrnasView.vue'),
      },
      {
        path: 'eleitores',
        name: 'Eleitores',
        component: () => import('../views/admin/EleitoresView.vue'),
      },
      {
        path: 'usuarios',
        name: 'Usuarios',
        component: () => import('../views/admin/UsuariosView.vue'),
      },
      {
        path: 'pessoas',
        name: 'Pessoas',
        component: () => import('../views/admin/PessoasView.vue'),
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Usa retorno direto em vez de next() — padrão recomendado no Vue Router 4
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) return '/login'
  if (to.meta.guest && auth.isAuthenticated) return '/dashboard'
  if (to.meta.adminOnly && auth.isAuthenticated && !auth.isAdmin) return '/login'
})

export default router
