/**
 * L'écran d'activation reste atteignable depuis une session ouverte (#409).
 *
 * ## Le défaut
 *
 * `guards.js:33` renvoie tout utilisateur authentifié loin d'une route
 * `guest: true` vers son tableau de bord. `/activation/:token` portait ce
 * drapeau : un navigateur avec une session LMS ouverte ne voyait JAMAIS l'écran,
 * et le porteur du lien concluait qu'il était cassé.
 *
 * `guest: true` confond deux choses. Pour `/login`, les deux sont vraies : la
 * page ne demande pas d'authentification, ET un utilisateur déjà connecté n'y a
 * rien à faire. Pour `/activation/:token`, seule la première l'est — le jeton
 * désigne un AUTRE compte que la session en cours.
 *
 * ## Ce que ce test prouve, et comment
 *
 * Il pilote le VRAI garde avec le VRAI `meta` de la route, lu depuis
 * `coreRoutes` — pas un `meta` reconstruit à la main. Un test qui s'écrirait
 * `navigationGuard(route({}), ...)` passerait même si la route portait encore
 * `guest: true` : il ne prouverait rien du parcours réel.
 *
 * Falsification exercée : remettre `guest: true` dans `core.routes.js` fait
 * rougir les deux derniers cas.
 *
 * @see tests/unit/routerRoutes.test.js — même invariant verrouillé sur le catch-all
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

import { coreRoutes } from '@/router/routes/core.routes'
import { navigationGuard } from '@/router/guards'

const ACTIVATION = coreRoutes.find((r) => r.path === '/activation/:token')

/** Destination telle que vue-router la présente au garde, avec le meta RÉEL. */
const destination = () => ({
  meta: ACTIVATION.meta ?? {},
  name: ACTIVATION.name,
  path: '/activation/jeton-de-test'
})

const provenance = () => ({ meta: {}, name: 'Login', path: '/login' })

describe("route d'activation atteignable depuis une session ouverte (#409)", () => {
  beforeEach(() => {
    isAuthenticated.mockReset()
    getUser.mockReset()
  })

  it('la route existe et ne se réserve PAS aux visiteurs anonymes', () => {
    expect(ACTIVATION).toBeDefined()
    expect(ACTIVATION.meta?.guest).toBeUndefined()
    expect(ACTIVATION.meta?.requiresAuth).toBeUndefined()
  })

  it('un visiteur anonyme y accède — le jeton EST son autorisation', () => {
    isAuthenticated.mockReturnValue(false)
    getUser.mockReturnValue(null)
    const next = vi.fn()

    navigationGuard(destination(), provenance(), next)

    expect(next).toHaveBeenCalledWith()
  })

  it("une session ouverte n'est PAS renvoyée vers son tableau de bord", () => {
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue({ role: 'enseignant' })
    const next = vi.fn()

    navigationGuard(destination(), provenance(), next)

    expect(next).toHaveBeenCalledWith()
  })

  it("le supradmin qui vérifie le lien qu'il vient de remettre y accède aussi", () => {
    // Le cas le PLUS probable : il valide une école, copie le lien, et le colle
    // dans son propre navigateur pour s'assurer qu'il fonctionne.
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue({ role: 'supradmin' })
    const next = vi.fn()

    navigationGuard(destination(), provenance(), next)

    expect(next).toHaveBeenCalledWith()
  })
})
