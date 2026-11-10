import { mount } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const { joinTrackedVisio, toastErreur, toastAttention, push, demarrer } = vi.hoisted(() => ({
  toastErreur: vi.fn(),
  toastAttention: vi.fn(),
  joinTrackedVisio: vi.fn(),
  push: vi.fn(),
  demarrer: vi.fn(),
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/services/evaluation', () => ({ default: { startEvaluation: (...a) => demarrer(...a) } }))
vi.mock('@/services/api', () => ({ default: {}, auth: { getUser: () => ({ klassci_id: 7, name: 'Eleve' }) } }))
vi.mock('@/composables/useToast', () => ({ toast: { error: (...x) => toastErreur(...x), warning: (...x) => toastAttention(...x), success: vi.fn(), info: vi.fn() } }))
vi.mock('@/services/lms', () => ({ lmsService: { hideSeance: vi.fn() } }))
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ currentUser: { name: 'Eleve' } })
}))
vi.mock('@/composables/useTrackedVisioJoin', () => ({
  useTrackedVisioJoin: () => ({ joinTrackedVisio })
}))

import StudentSchedule from '@/views/student/StudentSchedule.vue'

function mountView() {
  return mount(StudentSchedule, {
    global: {
      stubs: {
        DashboardLayout: { template: '<div><slot /></div>' },
        UniversalCalendar: {
          template: '<div><button class="join" @click="$emit(\'event-action\', { type: \'joinVisio\', data: { id: 9, visio_room_id: \'room-event-api\' } })">join</button>'
            + '<button class="demarrer" @click="$emit(\'event-action\', { type: \'startEvaluation\', data: { id: 3, titre: \'Devoir\' } })">démarrer</button></div>'
        }
      }
    }
  })
}

describe('StudentSchedule (#184)', () => {
  beforeEach(() => {
    joinTrackedVisio.mockReset()
    joinTrackedVisio.mockResolvedValue({ success: true })
    toastErreur.mockReset()
    toastAttention.mockReset()
    push.mockReset()
    demarrer.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  // #429 : un refus avec motif s'affiche par le catalogue (userMessage), pas par error.message.
  it('refus 403 avec motif : le toast porte le message du catalogue', async () => {
    joinTrackedVisio.mockRejectedValue(Object.assign(new Error('HTTP 403'), {
      response: { status: 403, data: { success: false, message: 'texte serveur', reason: 'not_enrolled' } },
      userMessage: 'Message du catalogue pour ce motif.',
    }))
    const w = mountView()
    await w.find('.join').trigger('click')
    await new Promise((fin) => setTimeout(fin, 0))
    expect(toastErreur).toHaveBeenCalledWith('Message du catalogue pour ce motif.', 'Visio')
  })

  it('400 (visio non active, sans motif) : l’avertissement « pas encore active » est conservé', async () => {
    joinTrackedVisio.mockRejectedValue(Object.assign(new Error('HTTP 400'), { response: { status: 400, data: { success: false, message: "La visio n'est pas active" } } }))
    const w = mountView()
    await w.find('.join').trigger('click')
    await new Promise((fin) => setTimeout(fin, 0))
    expect(toastAttention.mock.calls[0][0]).toMatch(/pas encore active/)
    expect(toastErreur).not.toHaveBeenCalled()
  })

  // Constat de la revue de #514 : « Démarrer » du calendrier poussait vers /take sans appeler /start
  // ni porter de submission_id (« ID de soumission manquant »), et n'héritait d'aucun motif de refus.
  // Le calendrier passe désormais par la MÊME porte que « Mes évaluations ».
  it('Démarrer depuis le calendrier appelle /start et ouvre la copie créée', async () => {
    demarrer.mockResolvedValue({ success: true, data: { id: 99 } })
    const w = mountView()
    await w.find('.demarrer').trigger('click')
    await new Promise((fin) => setTimeout(fin, 0))
    expect(demarrer).toHaveBeenCalledWith(3, 7)
    expect(push).toHaveBeenCalledWith({ name: 'TakeEvaluation', params: { id: 3 }, query: { submission_id: 99 } })
    expect(push).not.toHaveBeenCalledWith('/student/evaluations/3/take')
  })

  it('un refus depuis le calendrier montre son motif (#1011), jamais le texte du serveur', async () => {
    demarrer.mockRejectedValue({ response: { status: 403, data: { success: false, message: 'texte serveur', reason: 'evaluation_max_attempts' } } })
    const w = mountView()
    await w.find('.demarrer').trigger('click')
    await new Promise((fin) => setTimeout(fin, 0))
    expect(toastErreur).toHaveBeenCalledWith('Vous avez utilisé toutes vos tentatives pour cette évaluation.')
    expect(toastErreur.mock.calls.flat()).not.toContain('texte serveur')
    expect(push).not.toHaveBeenCalled()
  })

  it('rejoint la visio via le helper tracké', async () => {
    const w = mountView()

    await w.find('.join').trigger('click')

    expect(joinTrackedVisio).toHaveBeenCalledWith(
      { id: 9, visio_room_id: 'room-event-api' },
      { displayName: 'Eleve' },
    )
  })
})
