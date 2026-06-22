import { auth } from '@/services/api'
import { canActivate, getDashboardRoute, logRoleDecision } from '@/constants/roles'

/**
 * Guard de navigation global (G9 — extraction du `beforeEach` de router/index.js
 * pour isoler le code métier des définitions de routes).
 *
 * Comportement STRICTEMENT identique à l'origine :
 *  1. route protégée sans authentification → /login ;
 *  2. utilisateur authentifié sur une route guest → son dashboard (source unique) ;
 *  3. route à rôles requis → décision unique, normalisée, fail-secure via
 *     `canActivate` (même fonction que celle testée, bypass supradmin inclus).
 *
 * @param {import('vue-router').RouteLocationNormalized} to
 * @param {import('vue-router').RouteLocationNormalized} from
 * @param {import('vue-router').NavigationGuardNext} next
 */
export function navigationGuard(to, from, next) {
  const isAuthenticated = auth.isAuthenticated()
  const user = auth.getUser()

  // 1. Route protégée sans authentification → login
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next('/login')
  }

  // 2. Utilisateur authentifié sur une route guest → son dashboard (source unique)
  if (to.meta.guest && isAuthenticated) {
    return next(user ? getDashboardRoute(user) : '/login')
  }

  // 3. Route à rôles requis : décision unique, normalisée, fail-secure.
  //    canActivate est la MÊME fonction que celle testée (pas de logique dupliquée) ;
  //    le bypass supradmin y est appliqué sur le rôle normalisé (superAdmin == supradmin).
  if (to.meta.roles && user) {
    const decision = canActivate(user, to.meta.roles)
    if (!decision.allowed) {
      logRoleDecision('access_denied', { route: to.name ?? to.path })
      return next(decision.redirectTo)
    }
  }

  next()
}
