/**
 * Tests de la logique useMobileHeader (#H12) — services/router mockés, helpers de
 * rôle réels. Vérifie détection mobile, initiales, libellé de rôle, chemin profil
 * par rôle, exclusivité des panneaux, relais toggle-sidebar et déconnexion.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getUser = vi.fn()
const logout = vi.fn().mockResolvedValue()
vi.mock('@/services/api', () => ({
  auth: { getUser: () => getUser(), logout: () => logout() }
}))

const pushMock = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push: pushMock }) }))

import { useMobileHeader } from '@/composables/useMobileHeader'

function run() {
  let api
  const emitted = []
  const Host = {
    template: '<div />',
    emits: ['toggle-sidebar'],
    setup(_, { emit }) {
      api = useMobileHeader((e, ...a) => { emitted.push([e, ...a]); emit(e, ...a) })
      return {}
    }
  }
  const wrapper = mount(Host)
  return { api, wrapper, emitted }
}

describe('useMobileHeader (#H12)', () => {
  beforeEach(() => {
    getUser.mockReset()
    pushMock.mockReset()
    logout.mockClear()
    window.innerWidth = 500
  })

  it('détecte le mode mobile et calcule les initiales (nom complet)', () => {
    getUser.mockReturnValue({ role: 'enseignant', name: 'Jane Doe' })
    const { api } = run()
    expect(api.isMobile.value).toBe(true)
    expect(api.userInitials.value).toBe('JD')
  })

  it('dérive le chemin profil selon le rôle', () => {
    getUser.mockReturnValue({ role: 'etudiant', name: 'A B' })
    expect(run().api.profilePath.value).toBe('/student/profile')

    getUser.mockReturnValue({ role: 'enseignant', name: 'A B' })
    expect(run().api.profilePath.value).toBe('/teacher/profile')

    getUser.mockReturnValue({ role: 'coordinateur', name: 'A B' })
    expect(run().api.profilePath.value).toBe('/coordinateur/profile')
  })

  it('bascule les panneaux de façon exclusive', () => {
    getUser.mockReturnValue({ role: 'enseignant', name: 'A B' })
    const { api } = run()
    api.toggleNotifications()
    expect(api.showNotifications.value).toBe(true)
    api.toggleUserMenu()
    expect(api.showUserMenu.value).toBe(true)
    expect(api.showNotifications.value).toBe(false)
  })

  it('toggleSidebar émet toggle-sidebar et ferme les panneaux', () => {
    getUser.mockReturnValue({ role: 'enseignant', name: 'A B' })
    const { api, emitted } = run()
    api.showUserMenu.value = true
    api.toggleSidebar()
    expect(emitted).toContainEqual(['toggle-sidebar'])
    expect(api.showUserMenu.value).toBe(false)
  })

  it('handleLogout déconnecte puis redirige vers /login', async () => {
    getUser.mockReturnValue({ role: 'enseignant', name: 'A B' })
    await run().api.handleLogout()
    expect(logout).toHaveBeenCalled()
    expect(pushMock).toHaveBeenCalledWith('/login')
  })
})
