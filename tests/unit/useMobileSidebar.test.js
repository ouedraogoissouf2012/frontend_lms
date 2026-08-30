/**
 * Tests de la logique useMobileSidebar (#H12) — services/router mockés, helpers de
 * rôle réels. Vérifie les items de navigation par rôle, la fermeture auto au
 * passage desktop, et la déconnexion.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getUser = vi.fn()
const logout = vi.fn().mockResolvedValue()
vi.mock('@/services/api', () => ({
  auth: { getUser: () => getUser(), logout: () => logout() }
}))

const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/teacher/seances' }),
  useRouter: () => ({ push: pushMock })
}))

import { useMobileSidebar } from '@/composables/useMobileSidebar'

function run(isOpen = true) {
  let api
  const emitted = []
  const Host = {
    props: { isOpen: { type: Boolean, default: false } },
    emits: ['close'],
    template: '<div />',
    setup(props, { emit }) {
      api = useMobileSidebar(props, (e, ...a) => { emitted.push([e, ...a]); emit(e, ...a) })
      return {}
    }
  }
  const wrapper = mount(Host, { props: { isOpen } })
  return { api, wrapper, emitted }
}

describe('useMobileSidebar (#H12)', () => {
  beforeEach(() => {
    getUser.mockReset()
    pushMock.mockReset()
    logout.mockClear()
    window.innerWidth = 500
  })

  it('items enseignant : séances, forum, historique, paramètres', () => {
    getUser.mockReturnValue({ role: 'enseignant' })
    const paths = run().api.secondaryNavItems.value.map(i => i.path)
    expect(paths).toEqual(['/teacher/seances', '/forum', '/attendance/seances', '/teacher/settings'])
  })

  it('items coordinateur : forum, historique, paramètres admin', () => {
    getUser.mockReturnValue({ role: 'coordinateur' })
    const paths = run().api.secondaryNavItems.value.map(i => i.path)
    expect(paths).toEqual(['/forum', '/attendance/seances', '/admin/settings'])
  })

  it('étudiant : aucun item secondaire, aucun item admin', () => {
    getUser.mockReturnValue({ role: 'etudiant' })
    const { api } = run()
    expect(api.secondaryNavItems.value).toEqual([])
    expect(api.adminNavItems.value).toEqual([])
  })

  it('supradmin plateforme : lien Institutions (jamais les écrans intra-école) — #659', () => {
    getUser.mockReturnValue({ role: 'supradmin' })
    const paths = run().api.adminNavItems.value.map(i => i.path)
    expect(paths).toEqual(['/admin/institutions'])
  })

  it('admin d\'établissement : Classes / Matières / Enseignants (pas Institutions) — #659', () => {
    getUser.mockReturnValue({ role: 'admin' })
    const paths = run().api.adminNavItems.value.map(i => i.path)
    expect(paths).toEqual(['/admin/classes', '/admin/matieres', '/admin/enseignants'])
  })

  it('superAdmin (admin d\'école KLASSCI) : mêmes items admin qu\'un admin — #659', () => {
    getUser.mockReturnValue({ role: 'superAdmin' })
    const paths = run().api.adminNavItems.value.map(i => i.path)
    expect(paths).toEqual(['/admin/classes', '/admin/matieres', '/admin/enseignants'])
  })

  it('ferme automatiquement le drawer au passage en desktop si ouvert', async () => {
    getUser.mockReturnValue({ role: 'enseignant' })
    const { api, emitted } = run(true)
    window.innerWidth = 1024
    window.dispatchEvent(new Event('resize'))
    expect(api.isMobile.value).toBe(false)
    expect(emitted).toContainEqual(['close'])
  })

  it('handleLogout déconnecte, ferme et redirige', async () => {
    getUser.mockReturnValue({ role: 'enseignant' })
    const { api, emitted } = run()
    await api.handleLogout()
    expect(logout).toHaveBeenCalled()
    expect(emitted).toContainEqual(['close'])
    expect(pushMock).toHaveBeenCalledWith('/login')
  })
})
