/**
 * #418 : le lien d'activation est un SECRET, émis une seule fois et que rien ne permet de
 * réémettre (ActivationTokenService::emettre n'est appelé qu'à la validation).
 * - valider une autre demande tant qu'un lien est affiché est REFUSÉ : avant, valider()
 *   commençait par effacer le lien en attente ;
 * - le lien ne passe JAMAIS par la console, à travers le VRAI client HTTP (api.js et son
 *   intercepteur) : seul l'adaptateur réseau d'axios est remplacé.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'
import api from '@/services/api'
import { useAdminSchoolRequests } from '@/composables/useAdminSchoolRequests'
import { espionnerConsole } from '../helpers/consoleFuite'

const SECRET = 'https://lms.test/activation/Zq8VJ2pT0kLmNw7xR4sY'
let console_
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
// Détecteur partagé (tests/helpers/consoleFuite.js, #450) : erreurs mises à plat
// récursivement, corps envoyé ET reçu, garde de cycles.
const fuite = () => console_.contient('Zq8VJ2pT0kLmNw7xR4sY')
const valide = () => [200, { success: true, message: 'École ouverte.', data: { institution: { id: 9 }, activation_url: SECRET } }]

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  appels.length = 0
  console_ = espionnerConsole()
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
  console_.restaurer()
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

  // B1 (revue de #449), récidive de A1 (#441) et C2 (#447) : le lien n'existe qu'APRÈS
  // l'attente, donc garder sur lui seul laissait partir une 2ᵉ validation en vol.
  it('B1 : deux validations EN VOL : la 2ᵉ est refusée, et le lien de la 1ʳᵉ est conservé', async () => {
    let resoudreA
    api.defaults.adapter = (config) => {
      appels.push(`${config.method} ${config.url}`)
      return new Promise((resoudre) => {
        const id = config.url.match(/school-requests\/(\d+)/)[1]
        const reponse = { status: 200, statusText: '', headers: {}, config, data: { success: true, message: 'ok', data: { activation_url: `${SECRET}-${id}` } } }
        if (id === '1') resoudreA = () => resoudre(reponse)
        else resoudre(reponse)
      })
    }
    const r = useAdminSchoolRequests()
    const enVolA = r.valider(1, 'a')
    await Promise.resolve()
    expect(r.peutValider(2)).toBe(false)
    expect(await r.valider(2, 'b')).toBe(false)
    resoudreA()
    await enVolA
    expect(r.lienActivation.value).toBe(`${SECRET}-1`)
    expect(appels.filter((a) => a.startsWith('post'))).toHaveLength(1)
  })

  it('B1 (variante) : refuser B pendant que A est en vol ne réactive pas A', async () => {
    let resoudreA
    api.defaults.adapter = (config) => {
      appels.push(`${config.method} ${config.url}`)
      if (config.url.includes('/1/validate')) {
        return new Promise((resoudre) => { resoudreA = () => resoudre({ status: 200, statusText: '', headers: {}, config, data: { success: true, data: { activation_url: SECRET } } }) })
      }
      return Promise.resolve({ status: 200, statusText: '', headers: {}, config, data: { success: true } })
    }
    const r = useAdminSchoolRequests()
    const enVolA = r.valider(1, 'a')
    await Promise.resolve()
    await r.refuser(2, 'motif suffisamment long')
    expect(r.estOccupee(1)).toBe(true)
    expect(r.peutValider(1)).toBe(false)
    expect(await r.valider(1, 'a')).toBe(false)
    resoudreA()
    await enVolA
    expect(appels.filter((a) => a.includes('/1/validate'))).toHaveLength(1)
  })

  it('motifRetenue : rien au départ, « validation » pendant le vol, « lien » une fois le lien affiché', async () => {
    let resoudre
    api.defaults.adapter = (config) => new Promise((r) => { resoudre = () => r({ status: 200, statusText: '', headers: {}, config, data: { success: true, data: { activation_url: SECRET } } }) })
    const r = useAdminSchoolRequests()
    expect(r.motifRetenue.value).toBeNull()
    const enVol = r.valider(1, 'a')
    // Laisser la chaîne axios (intercepteurs) atteindre l'adaptateur avant de répondre.
    await new Promise((fin) => setTimeout(fin, 0))
    expect(r.motifRetenue.value).toBe('validation')
    resoudre()
    await enVol
    expect(r.motifRetenue.value).toBe('lien')
    r.fermerLien()
    expect(r.motifRetenue.value).toBeNull()
  })

  // À corriger 2 (revue du delta) : peutRefuser n'était couvert par aucun test.
  it('refuser A pendant que valider A est en vol : aucun POST de refus', async () => {
    let resoudreA
    api.defaults.adapter = (config) => {
      appels.push(`${config.method} ${config.url}`)
      return new Promise((r) => { resoudreA = () => r({ status: 200, statusText: '', headers: {}, config, data: { success: true, data: { activation_url: SECRET } } }) })
    }
    const r = useAdminSchoolRequests()
    const enVolA = r.valider(1, 'a')
    await Promise.resolve()
    expect(r.peutRefuser(1)).toBe(false)
    expect(await r.refuser(1, 'motif suffisamment long')).toBe(false)
    expect(appels.filter((a) => a.includes('/refuse'))).toEqual([])
    resoudreA()
    await enVolA
  })

  // À corriger 3 : après un ÉCHEC, la demande et la page sont libérées.
  it.each([500, 409])('validation rejetée (%i) : la demande est libérée, et une nouvelle validation envoie un POST', async (status) => {
    let rang = 0
    serveur(() => (rang++ === 0 ? [status, { success: false, message: 'refus' }] : valide()))
    const r = useAdminSchoolRequests()
    expect(await r.valider(1, 'a')).toBe(false)
    expect(r.peutValider(1)).toBe(true)
    expect(r.motifRetenue.value).toBeNull()
    expect(await r.valider(1, 'a')).toBe(true)
    expect(appels.filter((a) => a.includes('/1/validate'))).toHaveLength(2)
  })

  // Remarque 6 : une liste relue pendant la validation de A la faisait réapparaître.
  it('« Actualiser » pendant une validation en vol est refusé : A ne réapparaît pas', async () => {
    // L'ordre DANGEREUX est rejoué : une liste demandée pendant le vol, et rendue APRÈS la
    // réponse de la validation. Sans la garde, cette liste (lue avant) remet A dans la file.
    let resoudreA
    let resoudreListe = null
    const liste = (config) => ({ status: 200, statusText: '', headers: {}, config, data: { success: true, data: [{ id: 1 }, { id: 2 }], meta: { current_page: 1, last_page: 1 } } })
    let premiere = true
    api.defaults.adapter = (config) => {
      appels.push(`${config.method} ${config.url}`)
      if (config.method === 'get') {
        if (premiere) { premiere = false; return Promise.resolve(liste(config)) }
        return new Promise((r) => { resoudreListe = () => r(liste(config)) })
      }
      return new Promise((r) => { resoudreA = () => r({ status: 200, statusText: '', headers: {}, config, data: { success: true, data: { activation_url: SECRET } } }) })
    }
    const r = useAdminSchoolRequests()
    await r.load(1)
    appels.length = 0
    const enVolA = r.valider(1, 'a')
    await new Promise((fin) => setTimeout(fin, 0))
    const relecture = r.load(1)
    await new Promise((fin) => setTimeout(fin, 0))
    resoudreA()
    await enVolA
    if (resoudreListe) resoudreListe()
    const relue = await relecture
    // D'abord l'EFFET : A ne réapparaît pas, même si une liste a été rendue après la validation.
    expect(r.demandes.value.map((d) => d.id)).toEqual([2])
    expect(relue).toBe(false)
    expect(appels.filter((a) => a.startsWith('get'))).toEqual([])
  })

  // Condition de l'ARRÊT 3 (course inverse de la remarque 6) : une liste lue AVANT la
  // validation, et rendue APRÈS, ferait réapparaître la demande validée.
  it('valider pendant un chargement de la liste EN VOL : refusé, aucun POST', async () => {
    let resoudreListe
    api.defaults.adapter = (config) => {
      appels.push(`${config.method} ${config.url}`)
      if (config.method === 'get') return new Promise((r) => { resoudreListe = () => r({ status: 200, statusText: '', headers: {}, config, data: { success: true, data: [{ id: 1 }], meta: { current_page: 1, last_page: 1 } } }) })
      return Promise.resolve({ status: 200, statusText: '', headers: {}, config, data: { success: true, data: { activation_url: SECRET } } })
    }
    const r = useAdminSchoolRequests()
    const chargement = r.load(1)
    await new Promise((fin) => setTimeout(fin, 0))
    expect(r.peutValider(1)).toBe(false)
    expect(await r.valider(1, 'a')).toBe(false)
    expect(appels.filter((a) => a.startsWith('post'))).toEqual([])
    resoudreListe()
    await chargement
    expect(r.peutValider(1)).toBe(true)
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
    expect(console_.appelee('warn')).toBe(true)
    expect(fuite()).toBe(false)
  })

  it('le détecteur voit un lien caché dans la réponse d’une erreur (il ne passe pas à vide)', () => {
    console.warn('journal', new AxiosError('x', 'E', {}, {}, { data: { activation_url: SECRET } }))
    expect(fuite()).toBe(true)
  })
})
