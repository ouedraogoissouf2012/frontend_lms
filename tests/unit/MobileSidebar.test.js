/**
 * Test de MONTAGE de MobileSidebar.vue (G9 — fichier déjà < 300, vérif parité).
 *
 * Le drawer n'est rendu qu'en mobile ET ouvert (isOpen) : on force la largeur et
 * la prop. Vérifie le rendu et les entrées de navigation du rôle enseignant.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getUser = vi.fn()
vi.mock('@/services/api', () => ({
  auth: { getUser: () => getUser(), logout: vi.fn().mockResolvedValue() }
}))

const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/teacher/seances' }),
  useRouter: () => ({ push: pushMock })
}))

import MobileSidebar from '@/components/layout/MobileSidebar.vue'

function mountSidebar(isOpen = true) {
  return mount(MobileSidebar, {
    props: { isOpen },
    global: {
      stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } }
    }
  })
}

describe('MobileSidebar.vue (G9) — montage', () => {
  beforeEach(() => {
    window.innerWidth = 500 // mobile
    getUser.mockReset()
    pushMock.mockReset()
  })

  it('ouvert en mobile : rend le drawer et les entrées enseignant', () => {
    getUser.mockReturnValue({ role: 'enseignant' })
    const w = mountSidebar(true)

    expect(w.find('.mobile-sidebar').exists()).toBe(true)
    const hrefs = w.findAll('a.nav-link').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/teacher/seances')
    expect(hrefs).toContain('/forum')
    expect(hrefs).toContain('/teacher/settings')
  })

  it('admin : expose les raccourcis d\'administration intra-école, jamais Institutions (#659)', () => {
    getUser.mockReturnValue({ role: 'admin' })
    const w = mountSidebar(true)
    const hrefs = w.findAll('a.nav-link').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/admin/classes')
    expect(hrefs).toContain('/admin/matieres')
    expect(hrefs).toContain('/admin/enseignants')
    expect(hrefs).not.toContain('/admin/institutions')
  })

  it('superAdmin (admin d\'école KLASSCI) : mêmes raccourcis admin, jamais Institutions (#659)', () => {
    getUser.mockReturnValue({ role: 'superAdmin' })
    const w = mountSidebar(true)
    const hrefs = w.findAll('a.nav-link').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/admin/classes')
    expect(hrefs).not.toContain('/admin/institutions')
  })

  it('supradmin (plateforme) : expose Institutions, pas les écrans intra-école (#659)', () => {
    getUser.mockReturnValue({ role: 'supradmin' })
    const w = mountSidebar(true)
    const hrefs = w.findAll('a.nav-link').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/admin/institutions')
    expect(hrefs).not.toContain('/admin/classes')
  })

  it('fermé : ne rend pas le drawer', () => {
    getUser.mockReturnValue({ role: 'enseignant' })
    const w = mountSidebar(false)
    expect(w.find('.mobile-sidebar').exists()).toBe(false)
  })

  it('émet close au clic sur l\'overlay', async () => {
    getUser.mockReturnValue({ role: 'enseignant' })
    const w = mountSidebar(true)
    await w.find('.sidebar-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
