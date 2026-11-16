/**
 * #582, point 4 : `visio:teacher-left` (stores/visio.js) était émis quand l'enseignant quitte la salle, sans aucun
 * écouteur. Son intention est écrite dans le store : « les écrans dédiés exposent l'action terminer pour tous ».
 * Sans elle, les élèves restaient dans une visio que plus personne ne menait, sans que l'enseignant le sache.
 * `VisioRoom` (monté à la racine) l'écoute : il demande à l'enseignant s'il termine la visio pour tous.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({ endVisio: vi.fn(), getActive: vi.fn(), confirm: vi.fn(), succes: vi.fn(), erreur: vi.fn() }))
vi.mock('@/composables/useJitsiRoom', () => ({
  useJitsiRoom: () => ({ isRecording: { value: false }, mount: vi.fn(), dispose: vi.fn(), on: vi.fn(), startRecording: vi.fn(), stopRecording: vi.fn() }),
}))
vi.mock('@/composables/useVisioRecordingMirror', () => ({
  useVisioRecordingMirror: () => ({ mirroredOn: { value: null }, onProviderStatus: vi.fn(), reset: vi.fn() }),
}))
vi.mock('@/services/lms', () => ({ default: { getActiveVisioParticipation: h.getActive, endVisio: h.endVisio } }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ token: 'jeton', currentUser: { role: 'enseignant' } }) }))
vi.mock('@/services/visioFeedback', () => ({
  confirmVisioAction: h.confirm, notifyVisioSuccess: h.succes, notifyVisioError: h.erreur, notifyVisioWarning: vi.fn(),
}))

import VisioRoom from '@/components/visio/VisioRoom.vue'

const QUESTION = 'Vous avez quitté la salle. Terminer la visio pour tous les participants ?'
const depart = (seanceId) => window.dispatchEvent(new CustomEvent('visio:teacher-left', { detail: { seanceId } }))

beforeEach(() => {
  setActivePinia(createPinia())
  Object.values(h).forEach((f) => f.mockReset())
  h.getActive.mockResolvedValue({ data: null })
})

describe('#582.4 — l’enseignant qui quitte la salle peut terminer la visio pour tous', () => {
  it('il confirme : la visio est terminée pour tous (end-visio)', async () => {
    h.confirm.mockResolvedValue(true)
    h.endVisio.mockResolvedValue({ success: true, data: { participants_count: 2 } })
    const w = mount(VisioRoom, { attachTo: document.body })
    await flushPromises()
    depart(5)
    await flushPromises()
    expect(h.confirm).toHaveBeenCalledWith(QUESTION, expect.objectContaining({ confirmLabel: 'Terminer pour tous' }))
    expect(h.endVisio).toHaveBeenCalledWith(5)
    w.unmount()
  })

  it('il refuse : la visio continue', async () => {
    h.confirm.mockResolvedValue(false)
    const w = mount(VisioRoom, { attachTo: document.body })
    await flushPromises()
    depart(5)
    await flushPromises()
    expect(h.endVisio).not.toHaveBeenCalled()
    w.unmount()
  })

  it('après le démontage, l’événement n’est plus écouté', async () => {
    h.confirm.mockResolvedValue(true)
    const w = mount(VisioRoom, { attachTo: document.body })
    await flushPromises()
    w.unmount()
    depart(5)
    await flushPromises()
    expect(h.confirm).not.toHaveBeenCalled()
  })
})
