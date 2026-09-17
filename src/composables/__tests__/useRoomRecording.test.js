import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useRoomRecording } from '@/composables/useRoomRecording'
import { resetVisioConsentForTests, useVisioConsent } from '@/composables/useVisioConsent'
import * as feedback from '@/services/visioFeedback'

vi.mock('@/services/cache', () => ({ cacheKey: (n) => `${n}_test` }))

/**
 * #673 — l'enseignant commande l'enregistrement SANS quitter la salle.
 *
 * ## Pourquoi ce composable existe
 *
 * Le critère de fermeture de #673 est : « un enseignant presse LE SEUL bouton
 * du LMS, parle une minute, arrête — et le cours apparaît en chapitre vidéo
 * dans sa leçon, sans aucune autre action ».
 *
 * Or les boutons du LMS vivent sur la page de détail de séance, que la salle
 * RECOUVRE (`position: fixed; inset: 0; z-index: 9997`). Et le bouton natif de
 * Jitsi n'est pas dans la barre : mesuré dans le bundle déployé, `recording`
 * est en 16e position d'une barre coupée à 8 — il tombe dans le menu « … ».
 *
 * ## Pourquoi un composable et non du code dans le composant
 *
 * `VisioRoom` monte Jitsi ; le tester exigerait de simuler le chargement du
 * script externe. La décision — qui peut commander, sous quelles conditions —
 * n'a besoin d'aucun DOM. Le dépôt sépare déjà ainsi (`useVisioRecordingControls`).
 *
 * ## L'autorité est passée, jamais résolue ici
 *
 * Même raison que `useVisioRecordingControls` : dépendre du store à la
 * construction imposerait une instance Pinia partout où la salle est montée.
 */
describe('useRoomRecording (#673)', () => {
  let commandes

  const construire = (options = {}) => {
    commandes = {
      isRecording: ref(options.enregistre ?? false),
      startRecording: vi.fn().mockResolvedValue(undefined),
      stopRecording: vi.fn().mockResolvedValue(undefined),
      canManageRecording: () => options.peutGerer ?? true,
    }
    return useRoomRecording(commandes)
  }

  const consentirCaptation = () => {
    useVisioConsent().enregistrer({ captation: true, diffusion: false, reutilisation: false })
  }

  beforeEach(() => {
    localStorage.clear()
    resetVisioConsentForTests()
    vi.restoreAllMocks()
    vi.spyOn(feedback, 'confirmVisioAction').mockResolvedValue(true)
    vi.spyOn(feedback, 'notifyVisioWarning').mockImplementation(() => {})
    vi.spyOn(feedback, 'notifyVisioError').mockImplementation(() => {})
  })

  /**
   * Restaurer APRES chaque test, pas seulement avant.
   *
   * `vi.spyOn` remplace l'export du module partage. Restaure uniquement en
   * `beforeEach`, l'espion survit au DERNIER test de ce fichier et fuite vers
   * les suivants du meme worker. Mesure : la suite complete passait de 2272
   * verts a 3 echecs dans des fichiers sans aucun rapport (evaluations),
   * alors que ces memes fichiers passaient en isolation.
   */
  afterEach(() => {
    vi.restoreAllMocks()
    resetVisioConsentForTests()
  })

  it("l'enseignant propriétaire voit la commande", () => {
    expect(construire({ peutGerer: true }).peutCommander.value).toBe(true)
  })

  /**
   * `VisioRoom` est monté à la RACINE, pour TOUS les participants (`App.vue`).
   * Sans ce garde, chaque élève verrait un bouton d'enregistrement.
   */
  it("un participant sans autorité ne voit aucune commande", () => {
    expect(construire({ peutGerer: false }).peutCommander.value).toBe(false)
  })

  it("un participant sans autorité ne peut rien déclencher, même en forçant", async () => {
    const r = construire({ peutGerer: false })
    consentirCaptation()

    await r.basculer()

    expect(commandes.startRecording).not.toHaveBeenCalled()
  })

  /**
   * Le garde qui manquait : sans lui, l'enseignant lançait Jibri POUR DE VRAI,
   * le backend refusait en 422, et la vidéo finissait orpheline sur le disque.
   */
  it('sans consentement à la captation, rien ne part vers la salle', async () => {
    const r = construire()

    await r.basculer()

    expect(commandes.startRecording).not.toHaveBeenCalled()
    expect(feedback.notifyVisioWarning).toHaveBeenCalled()
  })

  it('avec consentement, la commande part vers la SALLE', async () => {
    const r = construire()
    consentirCaptation()

    await r.basculer()

    expect(commandes.startRecording).toHaveBeenCalledTimes(1)
  })

  it('un refus de confirmation n\'envoie rien', async () => {
    feedback.confirmVisioAction.mockResolvedValue(false)
    const r = construire()
    consentirCaptation()

    await r.basculer()

    expect(commandes.startRecording).not.toHaveBeenCalled()
  })

  /**
   * L'arrêt ne redemande PAS le consentement : refuser d'arrêter une captation
   * parce qu'on n'a plus le droit de la commencer serait absurde.
   */
  it("l'arrêt reste possible sans consentement", async () => {
    const r = construire({ enregistre: true })

    await r.basculer()

    expect(commandes.stopRecording).toHaveBeenCalledTimes(1)
    expect(commandes.startRecording).not.toHaveBeenCalled()
  })

  it('le libellé suit l\'état réel du fournisseur', () => {
    expect(construire({ enregistre: false }).libelle.value).toMatch(/enregistr/i)

    const enCours = construire({ enregistre: true })
    expect(enCours.libelle.value).toMatch(/arr[êe]ter/i)
  })

  it('un double clic ne lance pas deux enregistrements', async () => {
    const r = construire()
    consentirCaptation()

    await Promise.all([r.basculer(), r.basculer()])

    expect(commandes.startRecording).toHaveBeenCalledTimes(1)
  })

  it('un échec de la salle est signalé et ne casse rien', async () => {
    const r = construire()
    consentirCaptation()
    commandes.startRecording.mockRejectedValue(new Error('salle injoignable'))

    await expect(r.basculer()).resolves.not.toThrow()

    expect(feedback.notifyVisioError).toHaveBeenCalled()
    expect(r.enCours.value).toBe(false)
  })
})
