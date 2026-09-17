/**
 * L'écran d'activation NOMME la session déjà ouverte (#409).
 *
 * ## Pourquoi ce bandeau existe
 *
 * Depuis #409 la page s'ouvre même sous une session existante : le jeton est
 * l'autorisation, pas la session. Deux identités cohabitent alors à l'écran —
 * celle de l'URL et celle du navigateur — et le silence est trompeur : celui
 * qui pose son mot de passe croit agir sur le compte que le reste de
 * l'application lui affiche.
 *
 * Corriger la redirection sans dire ce qui se passe aurait remplacé un défaut
 * silencieux par un autre.
 *
 * ## Ce que ces tests NE prouvent PAS
 *
 * Que le bandeau DISPARAÎT après la déconnexion. En production `compteCourant`
 * lit le store Pinia à travers `auth.isAuthenticated()` et se recalcule ; ici
 * `auth` est feint par des `vi.fn()`, qui ne sont pas réactifs. Ces tests
 * prouvent que la déconnexion est DEMANDÉE, pas que l'écran se remet à jour.
 *
 * C'est dit plutôt que laissé croire — cf. frontend_lms#411, ouvert le même
 * jour pour un test dont le nom promettait davantage que son contenu.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const isAuthenticated = vi.fn()
const getUser = vi.fn()
const logout = vi.fn()

vi.mock('@/services/api', () => ({
  auth: {
    isAuthenticated: () => isAuthenticated(),
    getUser: () => getUser(),
    logout: () => logout()
  }
}))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { token: 'jeton-de-test' } })
}))
// Le composable réel est conservé ; seul l'appel réseau est feint.
vi.mock('@/services/activation', () => ({ activateAccount: vi.fn() }))

import ActivateAccount from '@/views/ActivateAccount.vue'

// Le stub REND son slot. `stubs: { RouterLink: true }` produit un
// `<router-link-stub>` VIDE : tout test affirmant l'absence du libellé d'un
// lien serait alors vert quoi qu'il arrive. Mesuré ici, pas supposé — la
// première version de ce fichier contenait ce faux vert.
const monter = () =>
  mount(ActivateAccount, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } }
  })

describe("écran d'activation sous une session ouverte (#409)", () => {
  beforeEach(() => {
    isAuthenticated.mockReset()
    getUser.mockReset()
    logout.mockReset()
  })

  it('ne dit rien quand aucune session n\'est ouverte', () => {
    isAuthenticated.mockReturnValue(false)
    getUser.mockReturnValue(null)

    const vue = monter()

    expect(vue.text()).not.toContain('Vous êtes connecté')
    expect(vue.find('button.underline').exists()).toBe(false)
  })

  it('nomme le compte connecté et signale que le lien en concerne un autre', () => {
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue({ name: 'Awa Traoré' })

    const vue = monter()

    expect(vue.text()).toContain('Awa Traoré')
    expect(vue.text()).toContain('Ce lien concerne un autre compte')
  })

  it('nomme la SITUATION quand le compte n\'a pas de nom lisible', () => {
    // Un compte sans nom reste un compte tiers : c'est cela qu'il faut dire,
    // et surtout pas se taire au motif que le nom manque.
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue({})

    const vue = monter()

    expect(vue.text()).toContain('un autre compte')
  })

  it('le bouton demande la déconnexion', async () => {
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue({ name: 'Awa Traoré' })

    const vue = monter()
    await vue.find('button.underline').trigger('click')

    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('le formulaire reste utilisable : le jeton prime sur la session', () => {
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue({ name: 'Awa Traoré' })

    const vue = monter()

    expect(vue.find('#password').exists()).toBe(true)
    expect(vue.find('#password_confirmation').exists()).toBe(true)
  })

  it("masque « Aller à la connexion » tant qu'une session est ouverte", () => {
    // Ce lien menerait vers /login, qui porte `guest: true` : le garde y
    // renverrait l'utilisateur vers SON tableau de bord. L'etat est NOUVEAU —
    // avant #409 un utilisateur authentifie ne voyait jamais cet ecran — donc
    // le piege a ete ouvert par le correctif et doit etre ferme avec lui.
    isAuthenticated.mockReturnValue(true)
    getUser.mockReturnValue({ name: 'Awa Traoré' })

    expect(monter().text()).not.toContain('Aller')
  })

  it('affiche « Aller à la connexion » a un visiteur anonyme', () => {
    isAuthenticated.mockReturnValue(false)
    getUser.mockReturnValue(null)

    expect(monter().text()).toContain('Aller')
  })
})
