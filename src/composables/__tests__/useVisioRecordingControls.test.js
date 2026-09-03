/**
 * Tests des contrôles d'enregistrement — src/composables/useVisioRecordingControls.js (#673)
 *
 * ## Ce que ce fichier verrouille
 *
 * Le bouton commande la SALLE, jamais la base. C'est le dernier maillon de la
 * correction de #673 : tant qu'il appelait `POST /recording/start` en direct,
 * il écrivait « enregistrement en cours » sans que Jibri en sache quoi que ce
 * soit — le défaut d'origine, constaté en production le 2026-09-02.
 *
 * La persistance revient au miroir (`useVisioRecordingMirror`), qui ne reflète
 * que ce que le fournisseur a réellement confirmé.
 */
import { ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { mockStartVisioRecording, mockStopVisioRecording, mockGetVisioRecording,
        mockConfirm, mockNotifyError, mockNotifySuccess, mockNotifyWarning } = vi.hoisted(() => ({
  mockStartVisioRecording: vi.fn(),
  mockStopVisioRecording: vi.fn(),
  mockGetVisioRecording: vi.fn(),
  mockConfirm: vi.fn(),
  mockNotifyError: vi.fn(),
  mockNotifySuccess: vi.fn(),
  mockNotifyWarning: vi.fn(),
}))

vi.mock('@/services/lms', () => ({
  default: {
    startVisioRecording: mockStartVisioRecording,
    stopVisioRecording: mockStopVisioRecording,
    getVisioRecording: mockGetVisioRecording,
  },
}))

vi.mock('@/services/visioFeedback', () => ({
  confirmVisioAction: mockConfirm,
  notifyVisioError: mockNotifyError,
  notifyVisioSuccess: mockNotifySuccess,
  notifyVisioWarning: mockNotifyWarning,
}))

import { useVisioRecordingControls } from '@/composables/useVisioRecordingControls'
import { useVisioStore } from '@/stores/visio'

function controls() {
  return useVisioRecordingControls({
    seanceId: ref(349),
    visio: ref({ enabled: true, status: 'active', recording: null }),
    canManageRecording: () => true,
    recordingProviderEnabled: () => true,
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  mockStartVisioRecording.mockReset().mockResolvedValue({ success: true, data: {} })
  mockStopVisioRecording.mockReset().mockResolvedValue({ success: true, data: {} })
  mockGetVisioRecording.mockReset().mockResolvedValue({ success: true, data: { status: 'idle' } })
  mockConfirm.mockReset().mockResolvedValue(true)
  mockNotifyError.mockReset()
  mockNotifySuccess.mockReset()
  mockNotifyWarning.mockReset()
})

describe('contrôles d\'enregistrement — le bouton commande la salle (#673)', () => {
  /**
   * LE test de la correction. Un appel direct au backend recréerait
   * exactement l'enregistrement fantôme du 2026-09-02 : une ligne
   * `status='recording'` pendant que Jibri reste `IDLE`.
   */
  it('C1 — démarrer n\'appelle JAMAIS le backend directement', async () => {
    const store = useVisioStore()
    const startRecording = vi.fn().mockResolvedValue(undefined)
    store.registerRoomCommands({ startRecording, stopRecording: vi.fn() })

    await controls().startRecording()

    expect(startRecording).toHaveBeenCalledTimes(1)
    expect(mockStartVisioRecording).not.toHaveBeenCalled()
  })

  it('C2 — arrêter suit la même règle', async () => {
    const store = useVisioStore()
    const stopRecording = vi.fn().mockResolvedValue(undefined)
    store.registerRoomCommands({ startRecording: vi.fn(), stopRecording })

    await controls().stopRecording()

    expect(stopRecording).toHaveBeenCalledTimes(1)
    expect(mockStopVisioRecording).not.toHaveBeenCalled()
  })

  /**
   * Sans salle ouverte, le refus doit être lisible par l'enseignant — et
   * surtout ne rien persister.
   */
  it('C3 — sans salle ouverte, l\'échec est notifié et rien n\'est persisté', async () => {
    await controls().startRecording()

    expect(mockNotifyError).toHaveBeenCalledTimes(1)
    expect(mockStartVisioRecording).not.toHaveBeenCalled()
    expect(mockNotifySuccess).not.toHaveBeenCalled()
  })

  it('C4 — un refus de confirmation n\'émet aucun ordre', async () => {
    const store = useVisioStore()
    const startRecording = vi.fn()
    store.registerRoomCommands({ startRecording, stopRecording: vi.fn() })
    mockConfirm.mockResolvedValue(false)

    await controls().startRecording()

    expect(startRecording).not.toHaveBeenCalled()
  })

  it('C5 — une séance non active refuse avant toute commande', async () => {
    const store = useVisioStore()
    const startRecording = vi.fn()
    store.registerRoomCommands({ startRecording, stopRecording: vi.fn() })

    const c = useVisioRecordingControls({
      seanceId: ref(349),
      visio: ref({ enabled: true, status: 'programmee' }),
      canManageRecording: () => true,
      recordingProviderEnabled: () => true,
    })
    await c.startRecording()

    expect(startRecording).not.toHaveBeenCalled()
    expect(mockNotifyWarning).toHaveBeenCalled()
  })

  /**
   * L'ordre a abouti : la ligne a été écrite par le miroir, pas par ce
   * composable. L'écran doit donc relire l'état persisté plutôt que de le
   * déduire — c'est ce qui empêche l'affichage de repartir d'une intention.
   */
  it('C6 — après confirmation, l\'état affiché est RELU côté serveur', async () => {
    const store = useVisioStore()
    store.registerRoomCommands({
      startRecording: vi.fn().mockResolvedValue(undefined),
      stopRecording: vi.fn(),
    })

    await controls().startRecording()

    expect(mockGetVisioRecording).toHaveBeenCalledWith(349)
    expect(mockNotifySuccess).toHaveBeenCalled()
  })
})
