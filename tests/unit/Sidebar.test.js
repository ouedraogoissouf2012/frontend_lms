/**
 * Test de MONTAGE de Sidebar.vue (G9 — décomposition < 300 lignes ; #108).
 *
 * Vérifie qu'avec le menu issu de la source unique `useNavigation()` (#104), la
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

  // Le payload RÉEL de `POST /auth/login` ne porte qu'un champ `name`
  // (whitelist fermée, #504). C'est le cas nominal.
  it('reflète les infos utilisateur (initiales, nom, rôle affiché)', () => {
    getUser.mockReturnValue({ role: 'etudiant', name: 'Jane Doe' })
    const w = mountSidebar()

    expect(w.find('.avatar').text()).toBe('JD')
    expect(w.find('.user-name').text()).toBe('Jane Doe')
    expect(w.find('.user-role').text()).toBe('Étudiant')
  })

  // Regression #371-bis : avant correctif, `.user-name` rendait une chaîne VIDE
  // et l'avatar le repli générique `U` — sur toutes les pages, tous rôles.
  it('ne rend JAMAIS un nom vide quand l’utilisateur est connu', () => {
    getUser.mockReturnValue({ role: 'enseignant', name: 'BEDE ABEL TEST' })
    const w = mountSidebar()

    expect(w.find('.user-name').text()).not.toBe('')
    expect(w.find('.avatar').text()).not.toBe('U')
  })

  it('rend le menu minimal du supradmin', () => {
    getUser.mockReturnValue({ role: 'supradmin', nom: 'Root' })
    const w = mountSidebar()

    const hrefs = w.findAll('a.nav-item').map((a) => a.attributes('href'))
    expect(hrefs).toEqual(['/admin/institutions'])
  })
})
