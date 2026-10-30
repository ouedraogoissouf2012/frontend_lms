/**
 * #416 — à l'écran : le bouton « Enregistrer le cours » n'est actionnable qu'une
 * fois la conférence jointe, et son texte dit pourquoi en attendant.
 *
 * Le VRAI `useJitsiRoom` est monté : seul le chargeur du script externe rend le
 * double partagé de l'IFrame API (tests/helpers/fakeJitsiApi.js).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

import { createFakeJitsiApi } from '../helpers/fakeJitsiApi'

const jitsi = createFakeJitsiApi()

// Paresseux : le double est lu à l'appel, après l'évaluation du module.
vi.mock('@/composables/useJitsiExternalApi', () => ({ loadJitsiExternalApi: () => Promise.resolve(jitsi.FakeApi) }))
vi.mock('@/services/cache', () => ({ cacheKey: (n) => `${n}_test` }))
vi.mock('@/services/lms', () => ({ default: { getActiveVisioParticipation: vi.fn().mockResolvedValue({ success: true, data: null }), saveVisioConsent: vi.fn().mockResolvedValue({ success: true }) } }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ token: 'jeton-de-session', currentUser: { role: 'enseignant' } }) }))
vi.mock('@/services/visioFeedback', () => ({
  notifyVisioError: vi.fn(),
  notifyVisioSuccess: vi.fn(),
  notifyVisioWarning: vi.fn(),
  confirmVisioAction: vi.fn().mockResolvedValue(true),
}))

import VisioRoom from '@/components/visio/VisioRoom.vue'
import { useVisioStore } from '@/stores/visio'
import { resetVisioConsentForTests, useVisioConsent } from '@/composables/useVisioConsent'

const ROOM_CONFIG = { domain: 'visio.test', roomName: 'lms_abc', jwt: 'jeton', displayName: 'Awa', canManageRecording: true }

beforeEach(() => {
  setActivePinia(createPinia())
  // Le consentement à la captation conditionne le démarrage : il est recueilli ici.
  resetVisioConsentForTests()
  useVisioConsent().enregistrer({ captation: true, diffusion: false, reutilisation: false })
})

async function ouvrirSalle() {
  const wrapper = mount(VisioRoom, { attachTo: document.body })
  const store = useVisioStore()
  store.roomConfig = ROOM_CONFIG
  await wrapper.vm.$nextTick()
  await wrapper.findComponent({ name: 'VisioJoinChoice' }).vm.$emit('rejoindre', 'complet')
  await flushPromises()
  return { wrapper, store }
}

describe('VisioRoom — enregistrer après la jonction (#416)', () => {
  it('avant la jonction : bouton désactivé, son texte dit « Connexion à la salle… »', async () => {
    const { wrapper } = await ouvrirSalle()
    const bouton = wrapper.get('.visio-room__record')
    expect(bouton.attributes('disabled')).toBeDefined()
    expect(bouton.text()).toBe('Connexion à la salle…')
    wrapper.unmount()
  })

  it('après videoConferenceJoined : bouton actif, libellé habituel, et l’ordre part', async () => {
    const { wrapper } = await ouvrirSalle()
    jitsi.last().emit('videoConferenceJoined', { roomName: 'lms_abc' })
    await flushPromises()
    const bouton = wrapper.get('.visio-room__record')
    expect(bouton.attributes('disabled')).toBeUndefined()
    expect(bouton.text()).toBe('Enregistrer le cours')
    await bouton.trigger('click')
    await flushPromises()
    expect(jitsi.last().commands).toEqual([{ name: 'startRecording', args: [{ mode: 'file' }] }])
    wrapper.unmount()
  })

  it('le chemin du store (commande sans bouton) est lui aussi refusé avant la jonction', async () => {
    const { wrapper, store } = await ouvrirSalle()
    await expect(store.startRoomRecording()).rejects.toThrow(/pas encore jointe/i)
    expect(jitsi.last().commands).toEqual([])
    wrapper.unmount()
  })
})
