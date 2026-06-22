/**
 * Test de montage de JitsiMeet.vue (G8 — Agent B).
 * Le composant charge dynamiquement le script Jitsi External API au montage (initJitsi)
 * et instancie window.JitsiMeetExternalAPI. On neutralise :
 *  - @/services/lms (joinVisio/leaveVisio/heartbeatVisio) → no-op
 *  - @/constants/visio (jitsiExternalApiSrc / getJitsiDomain / VISIO_CONFIG)
 *  - window.JitsiMeetExternalAPI → faux constructeur (addEventListener / dispose)
 *  Comme JitsiMeetExternalAPI est déjà défini, loadJitsiScript résout immédiatement
 *  (pas d'injection réelle de <script>).
 * Assertions : montage sans erreur (racine .jitsi-container) + le faux constructeur Jitsi
 * a été instancié au montage.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/services/lms', () => ({
  default: { joinVisio: vi.fn(() => Promise.resolve({ success: true })), leaveVisio: vi.fn(() => Promise.resolve()), heartbeatVisio: vi.fn(() => Promise.resolve()) }
}))
vi.mock('@/constants/visio', () => ({
  jitsiExternalApiSrc: () => 'https://meet.jit.si/external_api.js',
  getJitsiDomain: () => 'meet.jit.si',
  VISIO_CONFIG: { HEARTBEAT_INTERVAL_MS: 30000 }
}))

import JitsiMeet from '@/components/visio/JitsiMeet.vue'

const JitsiCtor = vi.fn(function () {
  this.addEventListener = vi.fn()
  this.dispose = vi.fn()
})

function mountJitsi(props = {}) {
  return mount(JitsiMeet, {
    props: {
      seanceId: 1,
      jitsiLink: 'https://meet.jit.si/RoomTest',
      userName: 'Alice',
      userEmail: 'alice@test.dev',
      ...props
    },
    global: { stubs: { ContentLoader: true } }
  })
}

describe('JitsiMeet.vue (G8) — montage', () => {
  beforeEach(() => {
    JitsiCtor.mockClear()
    // Définir l'API externe avant le montage → loadJitsiScript résout sans injecter de <script>
    window.JitsiMeetExternalAPI = JitsiCtor
  })
  afterEach(() => {
    delete window.JitsiMeetExternalAPI
  })

  it('monte sans erreur (racine .jitsi-container présente)', () => {
    const w = mountJitsi()
    expect(w.find('.jitsi-container').exists()).toBe(true)
  })

  it('instancie window.JitsiMeetExternalAPI au montage', async () => {
    mountJitsi()
    // initJitsi est async (await loadJitsiScript) → laisser la microtask se résoudre
    await Promise.resolve()
    await Promise.resolve()
    expect(JitsiCtor).toHaveBeenCalled()
  })
})
