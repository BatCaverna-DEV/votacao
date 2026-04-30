import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, adminOnly: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
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
        path: 'eleicoes/:id',
        name: 'EleicaoDetalhe',
        component: () => import('../views/admin/EleicaoDetalheView.vue'),
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
  {
    path: '/votar',
    component: () => import('../layouts/VotacaoLayout.vue'),
    meta: { requiresAuth: true, eleitorOnly: true },
    children: [
      {
        path: '',
        name: 'Votacao',
        component: () => import('../views/VotacaoView.vue'),
      },
    ],
  },
  {
    path: '/terminal/:urnaId',
    name: 'Terminal',
    component: () => import('../views/TerminalView.vue'),
    meta: { requiresAuth: true, adminOnly: true },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) return '/login'

  if (to.meta.guest && auth.isAuthenticated) {
    return auth.isAdmin ? '/admin/dashboard' : '/votar'
  }

  if (to.meta.adminOnly && auth.isAuthenticated && !auth.isAdmin) return '/votar'
  if (to.meta.eleitorOnly && auth.isAuthenticated && auth.isAdmin) return '/admin/dashboard'
})

export default router
