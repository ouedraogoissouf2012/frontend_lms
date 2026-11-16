/**
 * Back #1096 : `VisioRoom`, monté à la RACINE, appelait `GET /lms/visio/active` pour tout compte connecté, afin de
 * rouvrir une salle après un rechargement (#673). Le supradmin plateforme n'appartient à aucun établissement : la
 * porte du serveur lui répond 403 `no_institution` à CHAQUE chargement, et c'est voulu (une visio de séance est du
 * contenu pédagogique, que le supradmin ne voit pas, lot P5). L'écran ne pose donc plus la question pour lui.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

const h = vi.hoisted(() => ({ getActive: vi.fn(), compte: { role: 'enseignant' } }))

vi.mock('@/composables/useJitsiRoom', () => ({
  useJitsiRoom: () => ({ isRecording: { value: false }, mount: vi.fn(), dispose: vi.fn(), on: vi.fn(), startRecording: vi.fn(), stopRecording: vi.fn() }),
}))
vi.mock('@/composables/useVisioRecordingMirror', () => ({
  useVisioRecordingMirror: () => ({ mirroredOn: { value: null }, onProviderStatus: vi.fn(), reset: vi.fn() }),
}))
vi.mock('@/services/lms', () => ({ default: { getActiveVisioParticipation: h.getActive } }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ token: 'jeton-de-session', currentUser: h.compte }) }))
vi.mock('@/services/visioFeedback', () => ({ notifyVisioError: vi.fn(), notifyVisioSuccess: vi.fn(), notifyVisioWarning: vi.fn(), confirmVisioAction: vi.fn() }))

import VisioRoom from '@/components/visio/VisioRoom.vue'

beforeEach(() => {
  setActivePinia(createPinia())
  h.getActive.mockReset()
  h.getActive.mockResolvedValue({ data: null })
})

describe('back #1096 — la reprise de visio ne concerne que les comptes d’un établissement', () => {
  it('le supradmin plateforme : aucune requête à visio/active', async () => {
    h.compte = { role: 'supradmin' }
    mount(VisioRoom, { attachTo: document.body })
    await flushPromises()
    expect(h.getActive).not.toHaveBeenCalled()
  })

  it('un compte d’établissement (enseignant, élève, admin d’école) : la reprise est demandée', async () => {
    for (const role of ['enseignant', 'etudiant', 'admin']) {
      h.getActive.mockClear()
      h.compte = { role }
      mount(VisioRoom, { attachTo: document.body })
      await flushPromises()
      expect(h.getActive).toHaveBeenCalledTimes(1)
    }
  })
})
