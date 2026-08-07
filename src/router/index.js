import { createRouter, createWebHistory } from 'vue-router'
import { navigationGuard } from './guards'
import { coreRoutes } from './routes/core.routes'
import { adminRoutes } from './routes/admin.routes'
import { teacherRoutes } from './routes/teacher.routes'
import { studentRoutes } from './routes/student.routes'
import { sharedRoutes } from './routes/shared.routes'
import { fallbackRoutes } from './routes/fallback.routes'

// #27 : toutes les routes sont en lazy loading (() => import()) pour un code
// splitting systématique (un chunk par route). Voir la convention dans
// CONTRIBUTING.md (« <script setup> + lazy routes »).
//
// #H12 : les définitions de routes (verbatim, inchangées) sont regroupées par
// domaine dans ./routes/* pour garder chaque fichier ≤300 lignes. L'ordre de
// concaténation est strictement identique à l'ancien tableau monolithique, donc
// la résolution des routes par vue-router est inchangée.
//
// `fallbackRoutes` (catch-all 404) est concaténé EN DERNIER : vue-router classe
// les routes par spécificité, mais garder le repli en fin de tableau rend
// l'intention explicite et verrouillable par test.
const routes = [
  ...coreRoutes,
  ...adminRoutes,
  ...teacherRoutes,
  ...studentRoutes,
  ...sharedRoutes,
  ...fallbackRoutes
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard de navigation global (logique métier extraite dans ./guards)
router.beforeEach(navigationGuard)

export default router
