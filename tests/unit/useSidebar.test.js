/**
 * Tests de la logique useSidebar (#H12) — services/router mockés, helpers de rôle
 * et buildMenuSections réels. Vérifie infos utilisateur, repli persistant,
 * bascule des sous-menus et redirection profil selon le rôle.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getUser = vi.fn()
const getInstitution = vi.fn(() => 'inst-1')
vi.mock('@/services/api', () => ({
  auth: { getUser: () => getUser(), getInstitution: () => getInstitution() }
}))

const pushMock = vi.fn()
let currentRoute = { path: '/teacher/dashboard' }
vi.mock('vue-router', () => ({
  useRoute: () => currentRoute,
  useRouter: () => ({ push: pushMock })
}))

import { useSidebar } from '@/composables/useSidebar'

function run() {
  let api
  const Host = { template: '<div />', setup() { api = useSidebar(); return {} } }
  const wrapper = mount(Host)
  return { api, wrapper }
}

describe('useSidebar (#H12)', () => {
  beforeEach(() => {
    getUser.mockReset()
    pushMock.mockReset()
    currentRoute = { path: '/teacher/dashboard' }
    localStorage.clear()
  })

  it('expose les infos utilisateur (initiales, nom, rôle)', () => {
    getUser.mockReturnValue({ role: 'etudiant', nom: 'Doe', prenom: 'Jane' })
    const { api } = run()
    expect(api.userInitials.value).toBe('JD')
    // nom + prenom (ordre d'origine conservé)
    expect(api.userName.value).toBe('Doe Jane')
    expect(api.userRole.value).toBe('Étudiant')
  })

  it('dérive le menu du rôle courant (enseignant)', () => {
    getUser.mockReturnValue({ role: 'enseignant', nom: 'Doe', prenom: 'Jane' })
    const { api } = run()
    expect(Array.isArray(api.menuSections.value)).toBe(true)
    expect(api.menuSections.value.length).toBeGreaterThan(0)
  })

  it('toggleSidebar replie, vide les sous-menus et persiste', () => {
    getUser.mockReturnValue({ role: 'enseignant' })
    const { api } = run()
    api.openSubmenus.value = { 0: true }
    api.toggleSidebar()
    expect(api.isCollapsed.value).toBe(true)
    expect(api.openSubmenus.value).toEqual({})
    expect(localStorage.getItem('sidebar-collapsed-inst-1')).toBe('true')
  })

  it('toggleSubmenu ré-ouvre la sidebar si repliée puis bascule le sous-menu', () => {
    getUser.mockReturnValue({ role: 'enseignant' })
    const { api } = run()
    api.isCollapsed.value = true
    api.toggleSubmenu(2)
    expect(api.isCollapsed.value).toBe(false)
    expect(api.openSubmenus.value[2]).toBe(true)
  })

  it('goToProfile redirige selon le rôle', () => {
    getUser.mockReturnValue({ role: 'etudiant' })
    run().api.goToProfile()
    expect(pushMock).toHaveBeenCalledWith('/student/settings')

    pushMock.mockReset()
    getUser.mockReturnValue({ role: 'enseignant' })
    run().api.goToProfile()
    expect(pushMock).toHaveBeenCalledWith('/teacher/profile')

    pushMock.mockReset()
    getUser.mockReturnValue({ role: 'coordinateur' })
    run().api.goToProfile()
    expect(pushMock).toHaveBeenCalledWith('/admin/profile')
  })

  it('goToProfile sans utilisateur redirige vers /login', () => {
    getUser.mockReturnValue(null)
    run().api.goToProfile()
    expect(pushMock).toHaveBeenCalledWith('/login')
  })
})
