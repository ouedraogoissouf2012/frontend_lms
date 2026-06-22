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
