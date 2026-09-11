/**
 * L'identité de l'utilisateur doit s'afficher — partout, quel que soit le rôle.
 *
 * ## Le défaut, mesuré dans le navigateur le 2026-09-11
 *
 * Compte `prof.bede.test`, sur n'importe quelle page :
 *
 * ```
 * .user-name de la barre laterale  ->  ""      (chaine vide)
 * avatar                           ->  "U"     (repli generique)
 * ```
 *
 * `useSidebar` composait `` `${user.nom || ''} ${user.prenom || ''}`.trim() ``.
 * Les deux clés sont absentes de `POST /auth/login`, dont la whitelist est
 * FERMÉE (#504). Le repli `: 'Utilisateur'` ne se déclenchait jamais : il est
 * conditionné à l'absence de `user`, or `user` est un objet parfaitement valide
 * — il lui manque juste les deux champs qu'on lui demandait.
 *
 * L'application connaît pourtant le nom : elle l'affiche sur le tableau de bord
 * (« Bienvenue, BEDE ABEL TEST »), via `user.name`.
 *
 * ## Pourquoi aucun test ne l'a vu
 *
 * `useSidebar.test.js` fournissait `{ nom: 'Doe', prenom: 'Jane' }` — une charge
 * que l'API n'envoie pas. Vert sur du fictif. C'est la TROISIÈME occurrence de
 * ce motif dans ce chantier, après la fixture inventée de `useTeacherStats`.
 *
 * Ce fichier ne teste donc QUE contre `tests/fixtures/api/loginUser.js`, dont la
 * charge est copiée de `AuthResponsePresenter`.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { CLES_INEXISTANTES, LOGIN_USER_KLASSCI, LOGIN_USER_LOCAL } from '../fixtures/api/loginUser'

const getUser = vi.fn()
vi.mock('@/services/api', () => ({
  auth: {
    getUser: () => getUser(),
    getInstitution: () => 'inst-1',
    getUserRole: () => 'enseignant',
    isAdmin: () => false,
  },
  teacherStats: { getStats: vi.fn().mockResolvedValue({}) },
}))

const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/teacher/dashboard' }),
  useRouter: () => ({ push: pushMock }),
}))

import { useSidebar } from '@/composables/useSidebar'
import { useNavbar } from '@/composables/useNavbar'

function monter(composable) {
  let api
  mount({ template: '<div />', setup() { api = composable(); return {} } })
  return api
}

describe('identité utilisateur — charge de login RÉELLE', () => {
  beforeEach(() => {
    getUser.mockReset()
    localStorage.clear()
  })

  it('la charge de reference ne porte AUCUNE des cles fautives', () => {
    // Garde-fou du fichier : si quelqu'un « retablit » l'une de ces cles dans
    // une fixture, c'est qu'il reinvente la charge du backend.
    for (const cle of CLES_INEXISTANTES) {
      expect(LOGIN_USER_KLASSCI).not.toHaveProperty(cle)
      expect(LOGIN_USER_LOCAL).not.toHaveProperty(cle)
    }
  })

  describe('barre latérale', () => {
    it('affiche le nom, jamais une chaîne vide', () => {
      getUser.mockReturnValue(LOGIN_USER_KLASSCI)

      const api = monter(useSidebar)

      expect(api.userName.value).toBe('BEDE ABEL TEST')
      expect(api.userName.value.trim()).not.toBe('')
    })

    it('affiche de vraies initiales, pas le repli générique', () => {
      getUser.mockReturnValue(LOGIN_USER_KLASSCI)

      const api = monter(useSidebar)

      // 'BEDE ABEL TEST' -> premier + dernier mot.
      expect(api.userInitials.value).toBe('BT')
      expect(api.userInitials.value).not.toBe('U')
    })

    it('tient aussi sur la charge de connexion LOCALE, plus pauvre', () => {
      getUser.mockReturnValue(LOGIN_USER_LOCAL)

      const api = monter(useSidebar)

      expect(api.userName.value).toBe('BEDE ABEL TEST')
      expect(api.userInitials.value).toBe('BT')
    })

    it('sans utilisateur, le repli documenté s’applique toujours', () => {
      getUser.mockReturnValue(null)

      const api = monter(useSidebar)

      expect(api.userName.value).toBe('Utilisateur')
      expect(api.userInitials.value).toBe('U')
    })
  })

  describe('barre du haut', () => {
    it('affiche de vraies initiales', () => {
      getUser.mockReturnValue(LOGIN_USER_KLASSCI)

      const api = monter(useNavbar)

      expect(api.userInitials.value).toBe('BT')
      expect(api.userInitials.value).not.toBe('U')
    })

    it('sans utilisateur, repli générique', () => {
      getUser.mockReturnValue(null)

      const api = monter(useNavbar)

      expect(api.userInitials.value).toBe('U')
    })
  })
})
