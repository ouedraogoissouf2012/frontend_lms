/**
 * Tests PURS du guard de navigation (G9 — extraction du beforeEach de
 * router/index.js vers router/guards.js).
 *
 * Verrouille la parité des 3 branches d'origine : authentification requise,
 * route guest, contrôle de rôles fail-secure. Le service `auth` est mocké ; les
 * helpers de rôle réels (@/constants/roles) sont utilisés.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const isAuthenticated = vi.fn()
const getUser = vi.fn()
vi.mock('@/services/api', () => ({
  auth: {
    isAuthenticated: () => isAuthenticated(),
    getUser: () => getUser()
  }
}))

import { navigationGuard } from '@/router/guards'

const route = (meta = {}, name = 'X') => ({ meta, name, path: `/${name}` })

describe('navigationGuard (G9)', () => {
  beforeEach(() => {
    isAuthenticated.mockReset()
    getUser.mockReset()
  })

  it('route protégée + non authentifié → redirige vers /login', () => {
    isAuthenticated.mockReturnValue(false)
    getUser.mockReturnValue(null)
    const next = vi.fn()
    navigationGuard(route({ requiresAuth: true }), route(), next)
    expect(next).toHaveBeenCalledWith('/login')
  })

  it('route guest + authentifié → redirige vers le dashboard du rôle', () => {
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue({ role: 'enseignant' })
    const next = vi.fn()
    navigationGuard(route({ guest: true }), route(), next)
    expect(next).toHaveBeenCalledWith('/teacher/dashboard')
  })

  it('rôle insuffisant → redirige vers le dashboard de l\'utilisateur', () => {
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue({ role: 'etudiant' })
    const next = vi.fn()
    navigationGuard(route({ requiresAuth: true, roles: ['enseignant'] }), route(), next)
    expect(next).toHaveBeenCalledWith('/student/dashboard')
  })

  it('rôle autorisé → laisse passer (next sans argument)', () => {
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue({ role: 'enseignant' })
    const next = vi.fn()
    navigationGuard(route({ requiresAuth: true, roles: ['enseignant'] }), route(), next)
    expect(next).toHaveBeenCalledWith()
  })

  it('rôle admin autorisé sur une route admin → laisse passer', () => {
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue({ role: 'admin' })
    const next = vi.fn()
    navigationGuard(route({ requiresAuth: true, roles: ['superAdmin', 'admin', 'coordinateur'] }), route(), next)
    expect(next).toHaveBeenCalledWith()
  })

  it('supradmin bypass : accède à une route à rôles restreints', () => {
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue({ role: 'supradmin' })
    const next = vi.fn()
    navigationGuard(route({ requiresAuth: true, roles: ['enseignant'] }), route(), next)
    expect(next).toHaveBeenCalledWith()
  })

  it('route publique sans contrainte → laisse passer', () => {
    isAuthenticated.mockReturnValue(false)
    getUser.mockReturnValue(null)
    const next = vi.fn()
    navigationGuard(route({}), route(), next)
    expect(next).toHaveBeenCalledWith()
  })
})

/**
 * Anti-boucle de redirection.
 *
 * Un rôle non normalisable (absent de la table d'alias de constants/roles.js)
 * fait renvoyer '/login' par getDashboardRoute (roles.js:141-144), repris comme
 * `redirectTo` par canActivate (roles.js:168). Sans garde-fou, la règle 3
 * redirige vers /login, puis la règle 2 (route `guest`) redirige /login vers
 * '/login' → vue-router lève une erreur de redirection infinie.
 */
describe('navigationGuard — anti-boucle de redirection', () => {
  const UNKNOWN_USER = { role: 'parent' }

  beforeEach(() => {
    isAuthenticated.mockReset()
    getUser.mockReset()
  })

  it('rôle inconnu sur une route à rôles → redirige vers /login, jamais vers la route courante', () => {
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue(UNKNOWN_USER)
    const next = vi.fn()
    const target = { meta: { requiresAuth: true, roles: ['etudiant'] }, name: 'Forum', path: '/forum' }

    navigationGuard(target, route(), next)

    expect(next).toHaveBeenCalledWith('/login')
    expect(next).not.toHaveBeenCalledWith('/forum')
  })

  it('rôle inconnu arrivant sur /login → next() sans argument (pas de next(\'/login\'))', () => {
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue(UNKNOWN_USER)
    const next = vi.fn()
    const login = { meta: { guest: true }, name: 'Login', path: '/login' }

    navigationGuard(login, route(), next)

    expect(next).toHaveBeenCalledWith()
    expect(next).not.toHaveBeenCalledWith('/login')
  })

  it('la query string ne masque pas la détection (comparaison sur to.path)', () => {
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue(UNKNOWN_USER)
    const next = vi.fn()
    const login = { meta: { guest: true }, name: 'Login', path: '/login', fullPath: '/login?next=/forum' }

    navigationGuard(login, route(), next)

    expect(next).toHaveBeenCalledWith()
  })

  it('cible de repli == route refusée → laisse passer au lieu de boucler', () => {
    // Cas d'incohérence de configuration : l'étudiant est refusé sur une route
    // dont la cible de repli est son propre dashboard.
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue({ role: 'etudiant' })
    const next = vi.fn()
    const target = {
      meta: { requiresAuth: true, roles: ['enseignant'] },
      name: 'StudentDashboard',
      path: '/student/dashboard'
    }

    navigationGuard(target, route(), next)

    expect(next).toHaveBeenCalledWith()
    expect(next).not.toHaveBeenCalledWith('/student/dashboard')
  })

  // --- Non-régression : les redirections légitimes sont inchangées ---

  it('non-régression : étudiant sur route enseignant → /student/dashboard', () => {
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue({ role: 'etudiant' })
    const next = vi.fn()

    navigationGuard(route({ requiresAuth: true, roles: ['enseignant'] }, 'teacher-hub'), route(), next)

    expect(next).toHaveBeenCalledWith('/student/dashboard')
  })

  it('non-régression : rôle connu sur /login → son dashboard', () => {
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue({ role: 'coordinateur' })
    const next = vi.fn()
    const login = { meta: { guest: true }, name: 'Login', path: '/login' }

    navigationGuard(login, route(), next)

    expect(next).toHaveBeenCalledWith('/admin/dashboard')
  })

  it('non-régression : non authentifié sur route protégée → /login', () => {
    isAuthenticated.mockReturnValue(false)
    getUser.mockReturnValue(null)
    const next = vi.fn()

    navigationGuard(route({ requiresAuth: true }, 'forum'), route(), next)

    expect(next).toHaveBeenCalledWith('/login')
  })
})
