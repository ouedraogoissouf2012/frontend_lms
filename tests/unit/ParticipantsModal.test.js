/**
 * Test de montage de ParticipantsModal.vue (G8 — Agent B).
 * Le composant appelle lmsService.getVisioParticipants() au montage et lance un
 * setInterval de refresh. On mocke :
 *  - @/services/lms (default export lmsService.getVisioParticipants) → promesse résolue neutre
 *  - @/services/toast et @/services/errorHandler (utilisés par les exports) → no-op
 *  - @/constants/http (apiBaseUrl) → no-op
 * Pinia est fourni (le store auth est utilisé dans les méthodes d'export, pas au montage).
 * Assertions : montage sans erreur (overlay racine), appel du service au montage,
 * émission de `close` au clic sur le bouton Fermer du footer.
 */
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { getVisioParticipants } = vi.hoisted(() => ({
  getVisioParticipants: vi.fn(() =>
    Promise.resolve({ success: true, data: { students: [], statistics: {}, teacher: null, coordinator: null } })
  )
}))

vi.mock('@/services/lms', () => ({
  default: { getVisioParticipants },
  lmsService: { getVisioParticipants }
}))
vi.mock('@/services/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock('@/services/errorHandler', () => ({ normalizeError: (e) => ({ userMessage: String(e) }) }))
vi.mock('@/constants/http', () => ({ apiBaseUrl: () => 'http://test' }))

import ParticipantsModal from '@/components/visio/ParticipantsModal.vue'

function mountModal(props = {}) {
  return mount(ParticipantsModal, {
    props: { seanceId: 42, ...props },
    global: { plugins: [createPinia()] }
  })
}

describe('ParticipantsModal.vue (G8) — montage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    getVisioParticipants.mockClear()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('monte sans erreur (overlay racine présent)', () => {
    const w = mountModal()
    expect(w.find('.fixed').exists()).toBe(true)
  })

  it('appelle getVisioParticipants au montage avec le seanceId', () => {
    mountModal({ seanceId: 7 })
    expect(getVisioParticipants).toHaveBeenCalledWith(7)
  })

  it('émet `close` au clic sur le bouton Fermer du footer', async () => {
    const w = mountModal()
    // Le dernier bouton est le bouton "Fermer" du footer
    const buttons = w.findAll('button')
    await buttons[buttons.length - 1].trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
