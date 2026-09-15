import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetVisioConsentForTests, useVisioConsent } from '@/composables/useVisioConsent'
import lmsService from '@/services/lms'

vi.mock('@/services/cache', () => ({
  cacheKey: (name) => `${name}_test`,
}))

/**
 * Le consentement se dépose sur le SERVEUR (#716 ↔ #333).
 *
 * ## Pourquoi ces tests existent
 *
 * `useVisioConsent` rangeait le choix dans `localStorage`, et son propre
 * docblock l'annonçait comme provisoire : « en attendant lms_backend#716 ».
 *
 * Ce backend existe depuis le 2026-09-06 — table `consents`, garde append-only.
 * Mais le raccord n'avait jamais été fait : le front écrivait en local, le
 * serveur attendait une ligne qui n'arrivait jamais, et **refusait donc tout
 * enregistrement en 422**.
 *
 * Conséquence mesurée : Jibri enregistrait pour de vrai, puis le webhook de fin
 * ne trouvait aucune ligne active et rendait 404. La vidéo finissait orpheline
 * sur le disque — celle du 2026-08-31 y est encore.
 *
 * ## Ce que ces tests verrouillent
 *
 * 1. le choix part vraiment vers le serveur ;
 * 2. l'état reste SYNCHRONE — l'écran ne doit pas attendre le réseau pour
 *    afficher la case cochée, et les tests historiques de #333 restent verts ;
 * 3. une panne réseau ne perd pas le choix de l'utilisateur ni ne casse l'écran ;
 * 4. au chargement, le serveur fait autorité sur `localStorage`.
 */
describe('useVisioConsent — persistance serveur (#716)', () => {
  beforeEach(() => {
    localStorage.clear()
    resetVisioConsentForTests()
    vi.restoreAllMocks()
  })

  it('dépose les trois finalités sur le serveur', async () => {
    const envoi = vi.spyOn(lmsService, 'saveVisioConsent').mockResolvedValue({ success: true })

    const c = useVisioConsent()
    await c.enregistrer({ captation: true, diffusion: true, reutilisation: false })

    expect(envoi).toHaveBeenCalledWith({
      captation: true,
      diffusion: true,
      reutilisation: false,
    })
  })

  it('met l\'état à jour sans attendre le réseau', () => {
    let resoudre
    vi.spyOn(lmsService, 'saveVisioConsent').mockReturnValue(new Promise((r) => { resoudre = r }))

    const c = useVisioConsent()
    c.enregistrer({ captation: true, diffusion: false, reutilisation: false })

    // L'appel n'a PAS encore répondu : l'écran doit déjà refléter le choix.
    expect(c.choix.value.captation).toBe(true)
    expect(c.enregistrementAutorise.value).toBe(true)

    resoudre({ success: true })
  })

  it('une panne réseau ne perd pas le choix et ne casse pas l\'écran', async () => {
    vi.spyOn(lmsService, 'saveVisioConsent').mockRejectedValue(new Error('hors ligne'))

    const c = useVisioConsent()
    await expect(
      c.enregistrer({ captation: true, diffusion: true, reutilisation: true })
    ).resolves.not.toThrow()

    expect(c.choix.value.captation).toBe(true)
    // Le cache local prend le relais : un rechargement ne repart pas de zéro.
    expect(localStorage.getItem('visio_consent_test')).toContain('captation')
  })

  it('révoquer une finalité renvoie l\'état COMPLET au serveur', async () => {
    const envoi = vi.spyOn(lmsService, 'saveVisioConsent').mockResolvedValue({ success: true })

    const c = useVisioConsent()
    await c.enregistrer({ captation: true, diffusion: true, reutilisation: true })
    envoi.mockClear()

    await c.revoquer('diffusion')

    // Le serveur n'accepte pas de charge partielle : les trois finalités
    // repartent ensemble, c'est le contrat de StoreVisioConsentRequest.
    expect(envoi).toHaveBeenCalledWith({
      captation: true,
      diffusion: false,
      reutilisation: true,
    })
  })

  it("le serveur fait autorité : sa réponse écrase l'état déjà connu", async () => {
    vi.spyOn(lmsService, 'saveVisioConsent').mockResolvedValue({ success: true })

    const c = useVisioConsent()
    // Un état local déjà en place, volontairement DIFFÉRENT de la réponse serveur.
    await c.enregistrer({ captation: false, diffusion: false, reutilisation: false })
    expect(c.choix.value.captation).toBe(false)

    vi.spyOn(lmsService, 'getVisioConsent').mockResolvedValue({
      data: { captation: true, diffusion: true, reutilisation: false },
    })
    await c.rafraichirDepuisServeur()

    expect(c.choix.value.captation).toBe(true)
    expect(c.choix.value.diffusion).toBe(true)
    expect(c.choix.value.reutilisation).toBe(false)
  })

  it('un serveur injoignable ne perd pas ce qui était déjà connu', async () => {
    vi.spyOn(lmsService, 'saveVisioConsent').mockResolvedValue({ success: true })

    const c = useVisioConsent()
    await c.enregistrer({ captation: true, diffusion: false, reutilisation: false })

    vi.spyOn(lmsService, 'getVisioConsent').mockRejectedValue(new Error('hors ligne'))
    await expect(c.rafraichirDepuisServeur()).resolves.not.toThrow()

    // Mieux vaut un choix connu et peut-être ancien qu'un écran qui redemande
    // tout à chaque coupure réseau.
    expect(c.choix.value.captation).toBe(true)
  })
})
