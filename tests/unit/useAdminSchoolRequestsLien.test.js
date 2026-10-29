/**
 * #418 : le lien d'activation est un SECRET, émis une seule fois et que rien ne permet de
 * réémettre (ActivationTokenService::emettre n'est appelé qu'à la validation).
 * - valider une autre demande tant qu'un lien est affiché est REFUSÉ : avant, valider()
 *   commençait par effacer le lien en attente ;
 * - le lien ne passe JAMAIS par la console, à travers le VRAI client HTTP (api.js et son
 *   intercepteur) : seul l'adaptateur réseau d'axios est remplacé.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'
import api from '@/services/api'
import { useAdminSchoolRequests } from '@/composables/useAdminSchoolRequests'

const SECRET = 'https://lms.test/activation/Zq8VJ2pT0kLmNw7xR4sY'
const espions = []
let adaptateurOrigine
const appels = []

function serveur(routes) {
  api.defaults.adapter = async (config) => {
    appels.push(`${config.method} ${config.url}`)
    const [status, data] = routes(config)
    const response = { status, statusText: '', data, headers: {}, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}
// Les erreurs sont mises à plat AVANT JSON.stringify : AxiosError.toJSON() s'applique avant
// tout replacer et omet `response`, où un secret renvoyé par le serveur passerait inaperçu.
const aplatir = (v) => (v instanceof Error ? { message: v.message, stack: v.stack, data: v.config?.data ?? null, reponse: v.response?.data ?? null } : v)
const serialiser = (args) => JSON.stringify(args.map(aplatir))
const fuite = () => espions.some((s) => s.mock.calls.some((args) => serialiser(args).includes('Zq8VJ2pT0kLmNw7xR4sY')))
const valide = () => [200, { success: true, message: 'École ouverte.', data: { institution: { id: 9 }, activation_url: SECRET } }]

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  appels.length = 0
  for (const m of ['log', 'info', 'warn', 'error', 'debug']) espions.push(vi.spyOn(console, m).mockImplementation(() => {}))
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
  espions.splice(0).forEach((s) => s.mockRestore())
})

describe('#418 : un lien affiché n’est jamais effacé par une autre validation', () => {
  it('valider pendant qu’un lien est affiché : refusé, aucun appel, le lien reste', async () => {
    serveur(valide)
    const r = useAdminSchoolRequests()
    expect(await r.valider(1, 'a')).toBe(true)
    expect(r.lienActivation.value).toBe(SECRET)
    appels.length = 0
    expect(await r.valider(2, 'b')).toBe(false)
    expect(appels).toEqual([])
    expect(r.lienActivation.value).toBe(SECRET)
  })

  it('après « transmis » (fermerLien), une nouvelle validation repasse', async () => {
    serveur(valide)
    const r = useAdminSchoolRequests()
    await r.valider(1, 'a')
    r.fermerLien()
    expect(await r.valider(2, 'b')).toBe(true)
    expect(appels.filter((a) => a.startsWith('post'))).toHaveLength(2)
  })
})

describe('#418 (b) : le lien d’activation ne passe JAMAIS par la console ni par une URL', () => {
  it('validation réussie : rien en console, et le lien n’est dans aucune URL appelée', async () => {
    serveur(valide)
    const r = useAdminSchoolRequests()
    await r.valider(1, 'a')
    expect(fuite()).toBe(false)
    expect(appels.join(' ')).not.toContain('Zq8VJ2pT0kLmNw7xR4sY')
    expect(window.location.href).not.toContain('Zq8VJ2pT0kLmNw7xR4sY')
  })

  it('une erreur APRÈS un lien affiché (refus d’une autre demande en 500) : l’intercepteur journalise, sans le lien', async () => {
    serveur((config) => (config.url.includes('/refuse') ? [500, { success: false, message: 'erreur' }] : valide()))
    const r = useAdminSchoolRequests()
    await r.valider(1, 'a')
    await r.refuser(2, 'motif suffisamment long')
    expect(console.warn).toHaveBeenCalled()
    expect(fuite()).toBe(false)
  })

  it('le détecteur voit un lien caché dans la réponse d’une erreur (il ne passe pas à vide)', () => {
    console.warn('journal', new AxiosError('x', 'E', {}, {}, { data: { activation_url: SECRET } }))
    expect(fuite()).toBe(true)
  })
})
