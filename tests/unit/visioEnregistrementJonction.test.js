/**
 * #416 — l'enregistrement ne se commande qu'une fois la conférence JOINTE.
 *
 * `executeCommand` de l'IFrame API ne rejette jamais : avant la jonction, Jitsi
 * refuse l'ordre dans son propre journal (« Conference is not defined ») et le
 * LMS restait muet jusqu'au délai de garde de 120 s. L'IFrame API émet
 * `videoConferenceJoined` quand l'utilisateur local a rejoint, et
 * `videoConferenceLeft` quand il part (handbook, dev-guide-iframe-events).
 *
 * Double partagé de l'IFrame API (tests/helpers/fakeJitsiApi.js) : la frontière
 * réelle du dépôt (`useJitsiRoom`) est exercée telle quelle.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ROOM_NOT_JOINED_MESSAGE } from '@/composables/useJitsiRoom'
import { ROOM, mountRoom } from '../helpers/fakeJitsiApi'
import { useRoomRecording } from '@/composables/useRoomRecording'
import { resetVisioConsentForTests, useVisioConsent } from '@/composables/useVisioConsent'
import * as feedback from '@/services/visioFeedback'

vi.mock('@/services/cache', () => ({ cacheKey: (n) => `${n}_test` }))
// Le dépôt du consentement ne doit jamais partir sur le réseau dans ces tests.
vi.mock('@/services/lms', () => ({ default: { saveVisioConsent: vi.fn().mockResolvedValue({ success: true }) } }))

/** Salle montée (pas encore jointe) sur le double partagé de l'IFrame API. */
async function salleMontee() {
  const { room, last } = mountRoom()
  await room.mount({ ...ROOM, parentNode: document.createElement('div') })
  return { room, salle: last() }
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useJitsiRoom — l’ordre de démarrage attend la jonction', () => {
  it('avant videoConferenceJoined : refus IMMÉDIAT, aucun ordre posté, aucune attente de 120 s', async () => {
    vi.useFakeTimers()
    const { room, salle } = await salleMontee()
    expect(room.isJoined.value).toBe(false)
    const demarrage = room.startRecording()
    demarrage.catch(() => {})
    // Constaté AVANT d'attendre : sans le garde, la promesse resterait pendante.
    expect(salle.commands).toEqual([])
    expect(vi.getTimerCount()).toBe(0)
    await expect(demarrage).rejects.toThrow(ROOM_NOT_JOINED_MESSAGE)
  })

  it('après videoConferenceJoined : l’ordre part et se confirme sur l’événement du fournisseur', async () => {
    const { room, salle } = await salleMontee()
    salle.emit('videoConferenceJoined', { roomName: 'lms_abc', id: 'a1' })
    expect(room.isJoined.value).toBe(true)
    const demarrage = room.startRecording()
    expect(salle.commands).toEqual([{ name: 'startRecording', args: [{ mode: 'file' }] }])
    salle.emit('recordingStatusChanged', { on: true })
    await expect(demarrage).resolves.toBeUndefined()
  })

  it('après videoConferenceLeft, puis après dispose : de nouveau non jointe', async () => {
    const { room, salle } = await salleMontee()
    salle.emit('videoConferenceJoined', {})
    salle.emit('videoConferenceLeft', { roomName: 'lms_abc' })
    expect(room.isJoined.value).toBe(false)
    await expect(room.startRecording()).rejects.toThrow(ROOM_NOT_JOINED_MESSAGE)

    salle.emit('videoConferenceJoined', {})
    room.dispose()
    expect(room.isJoined.value).toBe(false)
  })

  it('l’ARRÊT n’est jamais bloqué par la jonction : on n’empêche pas d’interrompre une captation', async () => {
    const { room, salle } = await salleMontee()
    void room.stopRecording().catch(() => {})
    expect(salle.commands).toEqual([{ name: 'stopRecording', args: ['file'] }])
  })
})

describe('useRoomRecording — l’état visible du bouton', () => {
  let commandes
  let confirmer
  function construire({ jointe = false, enregistre = false } = {}) {
    commandes = {
      isRecording: ref(enregistre),
      isJoined: ref(jointe),
      startRecording: vi.fn().mockResolvedValue(undefined),
      stopRecording: vi.fn().mockResolvedValue(undefined),
      canManageRecording: () => true,
    }
    return useRoomRecording(commandes)
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    resetVisioConsentForTests()
    useVisioConsent().enregistrer({ captation: true, diffusion: false, reutilisation: false })
    confirmer = vi.spyOn(feedback, 'confirmVisioAction').mockResolvedValue(true)
  })

  it('salle non jointe : « Connexion à la salle… », pas prêt, et un clic n’ouvre même pas la confirmation', async () => {
    const r = construire({ jointe: false })
    expect(r.pret.value).toBe(false)
    expect(r.libelle.value).toBe('Connexion à la salle…')
    await r.basculer()
    expect(confirmer).not.toHaveBeenCalled()
    expect(commandes.startRecording).not.toHaveBeenCalled()
  })

  it('salle jointe : le libellé habituel, et le démarrage part', async () => {
    const r = construire({ jointe: true })
    expect(r.pret.value).toBe(true)
    expect(r.libelle.value).toBe('Enregistrer le cours')
    await r.basculer()
    expect(commandes.startRecording).toHaveBeenCalledTimes(1)
  })

  it('enregistrement en cours mais salle non jointe : l’arrêt reste possible', async () => {
    const r = construire({ jointe: false, enregistre: true })
    expect(r.pret.value).toBe(true)
    expect(r.libelle.value).toBe("Arrêter l'enregistrement")
    await r.basculer()
    expect(commandes.stopRecording).toHaveBeenCalledTimes(1)
  })

  it('pendant l’attente de confirmation du fournisseur : « Démarrage de l’enregistrement… », pas pendant la boîte de dialogue', async () => {
    let accepter
    confirmer.mockImplementation(() => new Promise((resolve) => { accepter = resolve }))
    let confirmerFournisseur
    const r = construire({ jointe: true })
    commandes.startRecording.mockImplementation(() => new Promise((resolve) => { confirmerFournisseur = resolve }))

    const bascule = r.basculer()
    await flushPromises()
    expect(r.libelle.value).toBe('Enregistrer le cours')

    accepter(true)
    await flushPromises()
    expect(r.libelle.value).toBe("Démarrage de l'enregistrement…")

    confirmerFournisseur()
    await bascule
    expect(r.libelle.value).toBe('Enregistrer le cours')
  })

  it('pendant l’attente d’un arrêt : « Arrêt de l’enregistrement… »', async () => {
    let confirmerFournisseur
    const r = construire({ jointe: true, enregistre: true })
    commandes.stopRecording.mockImplementation(() => new Promise((resolve) => { confirmerFournisseur = resolve }))
    const bascule = r.basculer()
    await flushPromises()
    expect(r.libelle.value).toBe("Arrêt de l'enregistrement…")
    confirmerFournisseur()
    await bascule
  })
})
