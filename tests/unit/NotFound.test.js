/**
 * Vue 404 (route catch-all). Verrouille les deux décisions du composant :
 *  1. la cible du bouton principal vient de la source unique `getDashboardRoute`
 *     quand une session existe, /login sinon ;
 *  2. le chemin demandé est affiché par interpolation (échappé par Vue).
 *
 * `vue-router` est mocké (le composant n'est pas monté dans un vrai routeur) et
 * `@/services/api` aussi, pour ne pas charger la couche HTTP réelle.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const push = vi.fn()
const back = vi.fn()
const isAuthenticated = vi.fn()
const getUser = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push, back }),
  useRoute: () => ({ fullPath: '/chemin/inconnu?x=1' })
}))

vi.mock('@/services/api', () => ({
  auth: {
    isAuthenticated: () => isAuthenticated(),
    getUser: () => getUser()
  }
}))

import NotFound from '@/views/NotFound.vue'

const RouterLinkStub = {
  name: 'RouterLink',
  props: { to: { type: [String, Object], default: '' } },
  template: '<a class="stub-link" :href="String(to)"><slot /></a>'
}

function mountView() {
  // Enregistré comme COMPOSANT (et non comme `stubs`) : `<router-link>` n'est
  // pas résolvable hors d'un vrai routeur, Vue normalise `router-link` en
  // `RouterLink` à la résolution.
  return mount(NotFound, {
    global: { components: { RouterLink: RouterLinkStub } }
  })
}

describe('NotFound.vue — page 404', () => {
  beforeEach(() => {
    push.mockReset()
    back.mockReset()
    isAuthenticated.mockReset()
    getUser.mockReset()
  })

  it('affiche le code 404 et le chemin demandé', () => {
    isAuthenticated.mockReturnValue(false)
    getUser.mockReturnValue(null)
    const w = mountView()

    expect(w.find('.notfound__code').text()).toBe('404')
    expect(w.find('.notfound__path').text()).toBe('/chemin/inconnu?x=1')
  })

  it('session étudiante → bouton vers le dashboard du rôle', () => {
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue({ role: 'etudiant' })
    const w = mountView()

    const link = w.findComponent(RouterLinkStub)
    expect(link.props('to')).toBe('/student/dashboard')
    expect(link.text()).toContain('Retour au tableau de bord')
  })

  it('session enseignante (alias backend `teacher`) → dashboard enseignant', () => {
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue({ role: 'teacher' })
    const w = mountView()

    expect(w.findComponent(RouterLinkStub).props('to')).toBe('/teacher/dashboard')
  })

  it('visiteur non authentifié → bouton vers /login', () => {
    isAuthenticated.mockReturnValue(false)
    getUser.mockReturnValue(null)
    const w = mountView()

    const link = w.findComponent(RouterLinkStub)
    expect(link.props('to')).toBe('/login')
    expect(link.text()).toContain('Aller à la connexion')
  })

  it('sans historique exploitable, « Page précédente » retombe sur la cible d\'accueil', async () => {
    // jsdom démarre avec window.history.length === 1 : la branche de repli est prise.
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue({ role: 'admin' })
    const w = mountView()

    await w.find('.notfound__btn--secondary').trigger('click')

    expect(back).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/admin/dashboard')
  })
})
