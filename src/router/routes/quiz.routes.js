import { AUTHENTICATED_ROLES } from './roleGroups'

// #226 : routes quiz (extraites verbatim de shared.routes.js).
export const quizRoutes = [
  // Quiz (module hérité) — Preuve : lien INCONDITIONNEL de Navbar.vue:50-56
  // (aucun `v-if` de rôle, contrairement aux liens enseignant/étudiant voisins
  // lignes 21-41) et absence totale du menu de navigation.js. Faute de preuve
  // d'un périmètre plus étroit, on conserve l'audience observée (tous rôles) ;
  // restreindre demanderait un arbitrage produit (cf. rapport).
  {
    path: '/quizzes',
    name: 'Quizzes',
    component: () => import('@/views/Quizzes.vue'),
    meta: { requiresAuth: true, roles: AUTHENTICATED_ROLES }
  },
  // Preuve : unique point d'entrée = Quizzes.vue:105 (`startQuiz`), donc même
  // audience que /quizzes ci-dessus.
  {
    path: '/quizzes/:id/take',
    name: 'QuizTake',
    component: () => import('@/views/QuizTake.vue'),
    meta: { requiresAuth: true, roles: AUTHENTICATED_ROLES }
  },
]
