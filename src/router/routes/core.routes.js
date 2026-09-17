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
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPassword.vue'),
    meta: { guest: true }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/ResetPassword.vue'),
    meta: { guest: true }
  },
  {
    path: '/ouvrir-une-ecole',
    name: 'SchoolRequest',
    component: () => import('@/views/SchoolRequest.vue'),
    meta: { guest: true }
  },
  // Volontairement SANS `guest: true` (#409). Ce drapeau dit deux choses à la
  // fois : « aucune authentification requise » ET « réservé aux anonymes, on
  // renvoie les autres » (guards.js:33). La première est vraie ici, la seconde
  // est FAUSSE : le jeton désigne un AUTRE compte que la session en cours.
  // Avec le drapeau, un navigateur portant une session ouverte — typiquement
  // celui du supradmin qui vérifie le lien qu'il vient de remettre — était
  // redirigé sans un mot, et le lien passait pour cassé.
  // Sans `requiresAuth` ni `guest` ni `roles` ni `capacite`, les quatre règles
  // du garde sont inertes et la route s'ouvre à tous. Verrouillé par
  // tests/unit/activationRouteAtteignable.test.js.
  {
    path: '/activation/:token',
    name: 'ActivateAccount',
    component: () => import('@/views/ActivateAccount.vue')
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
