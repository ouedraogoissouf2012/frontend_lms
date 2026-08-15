import { AUTHENTICATED_ROLES } from './roleGroups'

// #226 : routes forum (extraites verbatim de shared.routes.js).
export const forumRoutes = [
  // Preuve : navigation.js:56 (étudiant) + navigation.js:85 (enseignant,
  // coordinateur, admin) + useMobileSidebar.js:64,72 → les 4 rôles non
  // supradmin ; supradmin passe par le bypass de canActivate.
  {
    path: '/forum',
    name: 'Forum',
    component: () => import('@/views/Forum.vue'),
    meta: { requiresAuth: true, roles: AUTHENTICATED_ROLES }
  },
  // Preuve : unique point d'entrée = Forum.vue:162 (`viewTopic`) → même
  // audience que /forum.
  {
    path: '/forum/topics/:id',
    name: 'ForumTopic',
    component: () => import('@/views/ForumTopic.vue'),
    meta: { requiresAuth: true, roles: AUTHENTICATED_ROLES }
  },
]
