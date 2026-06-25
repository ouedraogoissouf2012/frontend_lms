import { auth } from '@/services/api'
import { getDashboardRoute } from '@/constants/roles'

// Routes « racine » : authentification et redirections vers le dashboard
// approprié (source unique getDashboardRoute, rôle normalisé #18). Extraites
// verbatim de router/index.js (#H12, ≤300 lignes/fichier). Définitions inchangées.
export const coreRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true }
  },
  // Redirection / vers dashboard approprié
  {
    path: '/',
    // Redirection via la source unique getDashboardRoute (rôle normalisé, #18)
    redirect: () => getDashboardRoute(auth.getUser())
  },
  // Redirect /admin → dashboard approprié selon le rôle normalisé
  {
    path: '/admin',
    redirect: () => getDashboardRoute(auth.getUser())
  }
]
