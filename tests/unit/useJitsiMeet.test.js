/**
 * Test du composable useJitsiMeet (#h13 ≤300) : logique extraite de JitsiMeet.vue.
 * On neutralise comme le test de montage du composant :
 *  - @/services/lms (joinVisio/leaveVisio/heartbeatVisio)
 *  - @/constants/visio (jitsiExternalApiSrc / getJitsiDomain / VISIO_CONFIG)
 *  - window.JitsiMeetExternalAPI → faux constructeur (addEventListener / dispose)
 * Le composable utilise onMounted/onBeforeUnmount → on le monte dans un composant
 * hôte minimal (calque useAdminUsers.test.js).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockJoin, mockLeave, mockHeartbeat } = vi.hoisted(() => ({
  mockJoin: vi.fn(() => Promise.resolve({ success: true })),
  mockLeave: vi.fn(() => Promise.resolve()),
  mockHeartbeat: vi.fn(() => Promise.resolve())
}))

vi.mock('@/services/lms', () => ({
  default: { joinVisio: mockJoin, leaveVisio: mockLeave, heartbeatVisio: mockHeartbeat }
}))
vi.mock('@/constants/visio', () => ({
  jitsiExternalApiSrc: () => 'https://meet.jit.si/external_api.js',
  getJitsiDomain: () => 'meet.jit.si',
  VISIO_CONFIG: { HEARTBEAT_INTERVAL_MS: 30000 }
}))

import { useJitsiMeet } from '@/composables/useJitsiMeet'

const JitsiCtor = vi.fn(function () {
  this.handlers = {}
  this.addEventListener = vi.fn((name, cb) => { this.handlers[name] = cb })
  this.dispose = vi.fn()
})

function setup(propsOverride = {}) {
  let api
  let lastInstance
  JitsiCtor.mockImplementation(function () {
    this.handlers = {}
    this.addEventListener = vi.fn((name, cb) => { this.handlers[name] = cb })
    this.dispose = vi.fn()
    lastInstance = this
  })
  const Comp = defineComponent({
    setup() {
      api = useJitsiMeet({
        seanceId: ref(propsOverride.seanceId ?? 1),
        jitsiLink: ref(propsOverride.jitsiLink ?? 'https://meet.jit.si/RoomTest'),
        userName: ref('Alice'),
        userEmail: ref('alice@test.dev'),
        emit: propsOverride.emit ?? vi.fn()
      })
      return () => null
    }
  })
  const wrapper = mount(Comp)
  return { api, wrapper, getInstance: () => lastInstance }
}

describe('useJitsiMeet (#h13)', () => {
  beforeEach(() => {
    JitsiCtor.mockClear()
    mockJoin.mockClear()
    mockLeave.mockClear()
    mockHeartbeat.mockClear()
    window.JitsiMeetExternalAPI = JitsiCtor
  })
  afterEach(() => {
    delete window.JitsiMeetExternalAPI
  })

  it('expose jitsiContainer, isLoading, error, cleanup', () => {
    const { api } = setup()
    expect(api.jitsiContainer).toBeDefined()
    expect(api.isLoading.value).toBe(true)
    expect(api.error.value).toBe(null)
    expect(typeof api.cleanup).toBe('function')
  })

  it('instancie JitsiMeetExternalAPI au montage et désactive le chargement', async () => {
    const { api } = setup()
    await flushPromises()
    expect(JitsiCtor).toHaveBeenCalledOnce()
    expect(api.isLoading.value).toBe(false)
  })

  it('met error et émet "error" si le lien Jitsi est invalide', async () => {
    const emit = vi.fn()
    const { api } = setup({ jitsiLink: 'not-a-url', emit })
    await flushPromises()
    expect(api.error.value).toBe('Erreur lors de la connexion à Jitsi')
    expect(emit).toHaveBeenCalledWith('error', expect.any(Error))
  })

  it('sur videoConferenceJoined : enregistre la participation et émet "joined"', async () => {
    const emit = vi.fn()
    const { getInstance } = setup({ seanceId: 42, emit })
    await flushPromises()
    await getInstance().handlers.videoConferenceJoined({ id: 'evt' })
    expect(mockJoin).toHaveBeenCalledWith(42)
    expect(emit).toHaveBeenCalledWith('joined', { id: 'evt' })
  })

  it('sur videoConferenceLeft : enregistre la sortie et émet "left" puis "close"', async () => {
    const emit = vi.fn()
    const { getInstance } = setup({ seanceId: 7, emit })
    await flushPromises()
    await getInstance().handlers.videoConferenceLeft({ id: 'bye' })
    expect(mockLeave).toHaveBeenCalledWith(7)
    expect(emit).toHaveBeenCalledWith('left', { id: 'bye' })
    expect(emit).toHaveBeenCalledWith('close')
  })

  it('cleanup dispose l\'instance Jitsi', async () => {
    const { api, getInstance } = setup()
    await flushPromises()
    const instance = getInstance()
    await api.cleanup()
    expect(instance.dispose).toHaveBeenCalledOnce()
  })
})
