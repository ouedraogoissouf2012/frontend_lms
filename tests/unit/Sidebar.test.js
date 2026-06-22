/**
 * Test de MONTAGE de Sidebar.vue (G9 — décomposition < 300 lignes).
 *
 * Vérifie qu'après extraction de `buildMenuSections` (utils/sidebarMenu), la
 * sidebar monte sans erreur, rend les entrées du rôle courant (parité de câblage
 * avec `auth.getUser()`) et expose les infos utilisateur (initiales/nom/rôle).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Service auth partagé mocké : on contrôle l'utilisateur courant.
const getUser = vi.fn()
vi.mock('@/services/api', () => ({
  auth: {
    getUser: () => getUser(),
    getInstitution: () => 'inst-1'
  }
}))

// Router : la sidebar lit route.path et utilise router.push (goToProfile).
const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/teacher/dashboard' }),
  useRouter: () => ({ push: pushMock })
}))

import Sidebar from '@/components/layout/Sidebar.vue'

function mountSidebar() {
  return mount(Sidebar, {
    global: {
      stubs: {
        // Rend le lien comme un <a> inspectable avec son href.
        RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' }
      }
    }
  })
}

describe('Sidebar.vue (G9) — montage', () => {
  beforeEach(() => {
    getUser.mockReset()
    pushMock.mockReset()
  })

  it('monte et rend les entrées du menu enseignant', () => {
    getUser.mockReturnValue({ role: 'enseignant', nom: 'Doe', prenom: 'Jane' })
    const w = mountSidebar()

    expect(w.find('.modern-sidebar').exists()).toBe(true)
    const hrefs = w.findAll('a.nav-item').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/teacher/dashboard')
    expect(hrefs).toContain('/teacher/hub')
    expect(hrefs).toContain('/teacher/settings')
  })

  it('reflète les infos utilisateur (initiales, nom, rôle affiché)', () => {
    getUser.mockReturnValue({ role: 'etudiant', nom: 'Doe', prenom: 'Jane' })
    const w = mountSidebar()

    expect(w.find('.avatar').text()).toBe('JD')
    // userName = `${nom} ${prenom}`.trim() → "Doe Jane" (ordre d'origine conservé)
    expect(w.find('.user-name').text()).toBe('Doe Jane')
    expect(w.find('.user-role').text()).toBe('Étudiant')
  })

  it('rend le menu minimal du supradmin', () => {
    getUser.mockReturnValue({ role: 'supradmin', nom: 'Root' })
    const w = mountSidebar()

    const hrefs = w.findAll('a.nav-item').map((a) => a.attributes('href'))
    expect(hrefs).toEqual(['/admin/institutions'])
  })
})
