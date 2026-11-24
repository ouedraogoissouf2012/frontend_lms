/**
 * #614 : `/activation/{jeton}` sert deux liens que le front ne sait pas distinguer (jeton opaque) : l'activation
 * remise par l'administrateur (#803) et la réinitialisation reçue par courriel (lms_backend#808, 60 min). Un lien
 * mort (410 : inconnu, consommé ou périmé) ou incomplet disait « Demandez-en un nouveau à votre administrateur. »,
 * faux pour une réinitialisation. L'écran dit désormais UN texte neutre, juste pour les deux liens et les deux cas,
 * tiré du catalogue du front (D0), avec un lien vers « Mot de passe oublié » ; le formulaire disparaît.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const TEXTE = 'Ce lien n\'est pas valide ou a expiré. Demandez-en un nouveau à votre administrateur, ou depuis « Mot de passe oublié ».'

const isAuthenticated = vi.fn()
vi.mock('@/services/api', () => ({
  auth: { isAuthenticated: () => isAuthenticated(), getUser: () => ({ first_name: 'Awa', last_name: 'Fictive' }), logout: vi.fn() },
}))
let jeton = 'jeton-fictif'
vi.mock('vue-router', () => ({ useRoute: () => ({ params: { token: jeton } }) }))
const activateAccount = vi.fn()
vi.mock('@/services/activation', () => ({ activateAccount: (...a) => activateAccount(...a) }))

import { useActivation } from '@/composables/useActivation'
import ActivateAccount from '@/views/ActivateAccount.vue'

// Une erreur telle que la pose l'intercepteur d'api.js : la réponse ET le texte du catalogue.
const echec = (status, userMessage) => ({ response: { status, data: { success: false, message: 'Texte serveur, jamais affiché' } }, userMessage })
const DEMANDE = { token: 'jeton-fictif', password: 'Secret123', password_confirmation: 'Secret123' }

beforeEach(() => {
  activateAccount.mockReset()
  isAuthenticated.mockReset()
  isAuthenticated.mockReturnValue(false)
  jeton = 'jeton-fictif'
})

describe('#614 — le catalogue porte le texte neutre du lien mort', () => {
  it('`gone` (seul producteur de 410 : ActivationController) offre les deux sorties', () => {
    expect(ERROR_MESSAGES.gone).toBe(TEXTE)
    expect(ERROR_MESSAGES.gone).toMatch(/à votre administrateur, ou depuis « Mot de passe oublié »/)
  })
})

describe('#614 — useActivation reconnaît le lien mort par son STATUT', () => {
  it('410 : `lienInvalide`, et le texte du catalogue', async () => {
    activateAccount.mockRejectedValue(echec(410, ERROR_MESSAGES.gone))
    const api = useActivation()
    await expect(api.submit(DEMANDE)).resolves.toBe(false)
    expect(api.lienInvalide.value).toBe(true)
    expect(api.error.value).toBe(TEXTE)
    expect(api.notice.value).toBe('')
  })

  it('un autre refus (422) n’est pas un lien mort', async () => {
    activateAccount.mockRejectedValue(echec(422, 'Certaines informations sont invalides.'))
    const api = useActivation()
    await api.submit(DEMANDE)
    expect(api.lienInvalide.value).toBe(false)
    expect(api.error.value).toBe('Certaines informations sont invalides.')
  })

  it('une nouvelle demande efface le lien mort de la précédente', async () => {
    const api = useActivation()
    activateAccount.mockRejectedValue(echec(410, ERROR_MESSAGES.gone))
    await api.submit(DEMANDE)
    activateAccount.mockResolvedValue({ success: true })
    await api.submit(DEMANDE)
    expect([api.lienInvalide.value, api.error.value]).toEqual([false, ''])
  })
})

describe('#614 — l’écran d’un lien mort ou incomplet', () => {
  // Le stub rend `to` en href et son slot : un `<router-link-stub>` vide rendrait verte toute absence (#409).
  const RouterLink = { props: ['to'], template: '<a :href="to"><slot /></a>' }
  const monter = () => mount(ActivateAccount, { global: { stubs: { RouterLink } } })
  const soumettre = async (vue) => {
    await vue.find('#password').setValue('Secret123')
    await vue.find('#password_confirmation').setValue('Secret123')
    await vue.find('form').trigger('submit')
    await flushPromises()
  }
  const lienOublie = (vue) => vue.find('a[href="/forgot-password"]')

  it('410 : le texte neutre, le lien vers « Mot de passe oublié », plus de formulaire', async () => {
    activateAccount.mockRejectedValue(echec(410, ERROR_MESSAGES.gone))
    const vue = monter()
    expect(lienOublie(vue).exists()).toBe(false)
    await soumettre(vue)
    expect(vue.text()).toContain(TEXTE)
    expect(vue.text().split(TEXTE).length).toBe(2)
    expect(lienOublie(vue).text()).toBe('Mot de passe oublié')
    expect(vue.find('form').exists()).toBe(false)
  })

  it('jeton absent : le même texte et le même lien, sans formulaire', () => {
    jeton = undefined
    const vue = monter()
    expect(vue.text()).toContain(TEXTE)
    expect(lienOublie(vue).exists()).toBe(true)
    expect(vue.find('form').exists()).toBe(false)
  })

  it('un 422 garde le formulaire et ne propose pas « Mot de passe oublié »', async () => {
    activateAccount.mockRejectedValue(echec(422, 'Certaines informations sont invalides.'))
    const vue = monter()
    await soumettre(vue)
    expect(vue.find('form').exists()).toBe(true)
    expect(lienOublie(vue).exists()).toBe(false)
  })

  it('session ouverte (#409) : le texte reste, le lien est masqué (`/forgot-password` est `guest`)', () => {
    isAuthenticated.mockReturnValue(true)
    jeton = undefined
    const vue = monter()
    expect(vue.text()).toContain(TEXTE)
    expect(lienOublie(vue).exists()).toBe(false)
  })
})

describe('#614 — plus aucun texte de lien mort écrit en dur dans la vue', () => {
  it('ActivateAccount.vue ne renvoie plus « à votre administrateur. » seul', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/views/ActivateAccount.vue'), 'utf8')
    expect(source).not.toMatch(/à votre administrateur\./)
    expect(source).not.toMatch(/Ce lien est incomplet/)
  })
})
