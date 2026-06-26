/**
 * Tests de la logique useSidebar (#H12, #108) — services/router mockés, helpers de
 * rôle et la config de navigation réelle (`useNavigation`/`NAV_SECTIONS`). Vérifie
 * infos utilisateur, menu dérivé du rôle (parité stricte de routes via la source
 * unique #104), repli persistant, bascule des sous-menus et redirection profil.
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

  it('dérive le menu du rôle courant via useNavigation (parité enseignant)', () => {
    getUser.mockReturnValue({ role: 'enseignant', nom: 'Doe', prenom: 'Jane' })
    const { api } = run()
    // Parité stricte avec la source unique #104 (mêmes routes, même ordre que
    // l'ancien buildMenuSections — verrouille le câblage useSidebar→useNavigation).
    expect(api.menuSections.value.map((s) => s.to)).toEqual([
      '/teacher/dashboard',
      '/teacher/schedule',
      '/teacher/hub',
      '/teacher/evaluations',
      '/forum',
      '/attendance/seances',
      '/teacher/settings'
    ])
  })

  it('menu minimal du supradmin (Institutions uniquement)', () => {
    getUser.mockReturnValue({ role: 'supradmin', nom: 'Root' })
    const { api } = run()
    expect(api.menuSections.value.map((s) => s.to)).toEqual(['/admin/institutions'])
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
