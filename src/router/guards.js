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
 * ... à une exception près : les règles 2 et 3 ne se redirigent plus vers la
 * destination courante (cf. `redirectUnlessCurrent`), ce qui faisait boucler
 * vue-router pour un rôle non normalisable.
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
    return redirectUnlessCurrent(to, user ? getDashboardRoute(user) : '/login', next)
  }

  // 3. Route à rôles requis : décision unique, normalisée, fail-secure.
  //    canActivate est la MÊME fonction que celle testée (pas de logique dupliquée) ;
  //    le bypass est réservé au supradmin PLATEFORME (rôle normalisé 'supradmin').
  //    'superAdmin' (admin d'établissement) normalise vers 'admin' et ne bypasse pas (#659).
  if (to.meta.roles && user) {
    const decision = canActivate(user, to.meta.roles)
    if (!decision.allowed) {
      logRoleDecision('access_denied', { route: to.name ?? to.path })
      return redirectUnlessCurrent(to, decision.redirectTo, next)
    }
  }

  next()
}

/**
 * Redirige vers `target`, SAUF si c'est déjà la destination demandée — auquel
 * cas on laisse passer.
 *
 * Sans ce garde-fou, un utilisateur authentifié dont le rôle n'est pas
 * normalisable (absent de la table d'alias de constants/roles.js) boucle :
 * `getDashboardRoute` renvoie '/login' (roles.js:141-144), `canActivate` le
 * reprend comme `redirectTo` (roles.js:168), la règle 3 fait `next('/login')`,
 * puis la règle 2 rejoue sur /login (`guest: true`) et redirige vers... '/login'.
 * vue-router lève alors une erreur de redirection infinie.
 *
 * On compare `to.path` et NON `to.fullPath` : une query string (ex.
 * `/login?next=...`) ne doit pas faire échouer la détection.
 *
 * Compromis assumé : si la cible calculée est la route même qui vient d'être
 * refusée, l'utilisateur y accède au lieu d'être bloqué. Ce cas suppose une
 * incohérence de configuration (DASHBOARD_ROUTES pointant vers une route
 * interdite au rôle) ; laisser voir SON PROPRE dashboard reste préférable à un
 * crash de navigation. La décision est journalisée.
 *
 * @param {import('vue-router').RouteLocationNormalized} to
 * @param {string|null} target
 * @param {import('vue-router').NavigationGuardNext} next
 */
function redirectUnlessCurrent(to, target, next) {
  if (target && to.path === target) {
    logRoleDecision('redirect_loop_avoided', { route: to.path })
    return next()
  }
  return next(target)
}
