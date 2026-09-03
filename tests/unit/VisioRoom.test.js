/**
 * Tests du composant VisioRoom — src/components/visio/VisioRoom.vue (#673)
 *
 * Le composant est monté à la racine de l'application, hors de <router-view> :
 * c'est ce qui fait survivre la salle à la navigation interne, propriété que
 * l'onglet séparé apportait avant #673.
 *
 * Ce fichier verrouille surtout un défaut trouvé en relecture : un échec de
 * montage était affiché dans un élément du composant lui-même, alors que la
 * compensation qui suit remet `roomConfig` à `null` — donc le `v-if` démonte
 * tout et le message n'est JAMAIS lu. Un échec silencieux, exactement la classe
 * de défaut que ce chantier corrige.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

const { mockMount, mockDispose, mockOn, mockNotifyError, mockOnProviderStatus } = vi.hoisted(() => ({
  mockMount: vi.fn(),
  mockDispose: vi.fn(),
  mockOn: vi.fn(),
  mockNotifyError: vi.fn(),
  mockOnProviderStatus: vi.fn(),
}))

vi.mock('@/composables/useJitsiRoom', () => ({
  useJitsiRoom: () => ({
    isRecording: { value: false },
    mount: mockMount,
    dispose: mockDispose,
    on: mockOn,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
  }),
}))

vi.mock('@/composables/useVisioRecordingMirror', () => ({
  useVisioRecordingMirror: () => ({
    mirroredOn: { value: null },
    onProviderStatus: mockOnProviderStatus,
    reset: vi.fn(),
  }),
}))

vi.mock('@/services/visioFeedback', () => ({
  notifyVisioError: mockNotifyError,
  notifyVisioSuccess: vi.fn(),
  notifyVisioWarning: vi.fn(),
  confirmVisioAction: vi.fn(),
}))

import VisioRoom from '@/components/visio/VisioRoom.vue'
import { useVisioStore } from '@/stores/visio'

const ROOM_CONFIG = {
  domain: 'visio.klassci.com',
  roomName: 'lms_abc',
  jwt: 'jeton',
  displayName: 'Awa',
}

beforeEach(() => {
  setActivePinia(createPinia())
  mockMount.mockReset().mockResolvedValue(undefined)
  mockDispose.mockReset()
  mockOn.mockReset()
  mockNotifyError.mockReset()
})

describe('VisioRoom', () => {
  it('R1 — sans salle décrite, rien n\'est rendu ni monté', async () => {
    const wrapper = mount(VisioRoom)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.visio-room').exists()).toBe(false)
    expect(mockMount).not.toHaveBeenCalled()
  })

  /**
   * Les écouteurs de sortie et d'enregistrement sont posés AVANT le montage :
   * un enregistrement déjà en cours à l'entrée en salle doit être reflété, et
   * un départ immédiat ne doit pas passer inaperçu.
   */
  it('R2 — les écouteurs sont posés dès la construction', () => {
    mount(VisioRoom)

    const events = mockOn.mock.calls.map(([event]) => event)
    expect(events).toContain('recordingStatusChanged')
    expect(events).toContain('videoConferenceLeft')
    expect(events).toContain('readyToClose')
  })

  it('R3 — une salle décrite est montée avec le nœud du composant', async () => {
    const wrapper = mount(VisioRoom, { attachTo: document.body })
    const store = useVisioStore()

    store.roomConfig = ROOM_CONFIG
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(mockMount).toHaveBeenCalledTimes(1)
    const args = mockMount.mock.calls[0][0]
    expect(args.roomName).toBe(ROOM_CONFIG.roomName)
    expect(args.jwt).toBe(ROOM_CONFIG.jwt)
    expect(args.parentNode).toBeTruthy()
  })

  /**
   * LE test du défaut trouvé en relecture. La compensation démonte le
   * composant : le message DOIT donc sortir par un toast, qui survit au
   * démontage. Sinon l'utilisateur voit une salle qui ne s'ouvre pas, sans
   * aucune explication.
   */
  it('R4 — un échec de montage est notifié hors du composant, et compensé', async () => {
    mockMount.mockRejectedValue(new Error('module de visioconférence indisponible'))
    const wrapper = mount(VisioRoom, { attachTo: document.body })
    const store = useVisioStore()
    const leaveVisio = vi.spyOn(store, 'leaveVisio').mockResolvedValue(undefined)

    store.roomConfig = ROOM_CONFIG
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    await Promise.resolve()

    expect(mockNotifyError).toHaveBeenCalledTimes(1)
    expect(leaveVisio).toHaveBeenCalledTimes(1)
  })

  it('R5 — la disparition de la salle libère l\'instance Jitsi', async () => {
    const wrapper = mount(VisioRoom, { attachTo: document.body })
    const store = useVisioStore()

    store.roomConfig = ROOM_CONFIG
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    mockDispose.mockClear()

    store.roomConfig = null
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(mockDispose).toHaveBeenCalled()
  })
})
