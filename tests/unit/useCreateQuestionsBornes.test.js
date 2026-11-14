/**
 * B5 (D461, lms_backend #1069) : l'éditeur refuse le 27e ajout, et une question chargée hors bornes
 * (plus de 26 options, ou une option de plus de 1 000 caractères) n'est enregistrée qu'une fois
 * corrigée. Rien n'est tronqué ni retiré sans le dire.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  route: { query: { klassci_id: '5' }, params: { id: '42' } },
  getEvaluations: vi.fn(),
  getEvaluation: vi.fn(),
  updateEvaluation: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

vi.mock('vue-router', () => ({ useRoute: () => h.route, useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }))
vi.mock('@/services/klassci', () => ({ default: { getEvaluations: h.getEvaluations, getTeacherDashboard: vi.fn() } }))
vi.mock('@/services/evaluation', () => ({
  default: { getEvaluation: h.getEvaluation, createEvaluation: vi.fn(), publishEvaluation: vi.fn(), updateEvaluation: h.updateEvaluation },
}))
vi.mock('@/composables/useToast', () => ({ toast: h.toast }))

import { useCreateQuestions } from '@/composables/useCreateQuestions'

const HORS_BORNES = "Cette question dépasse les bornes : 26 options au plus, de 1 000 caractères chacune. Retirez ou raccourcissez des options avant d'enregistrer."
const n = (k, longueur = 1) => Array.from({ length: k }, (_, i) => `${String.fromCharCode(65 + (i % 26))}${i}`.padEnd(longueur, '.'))

async function ouvrir(options) {
  h.getEvaluation.mockResolvedValue({ success: true, data: { id: 42, duree_minutes: 30, questions: [{ question: 'Q', type: 'qcm', points: 1, options, correct_answers: [options[0]] }] } })
  let api
  mount(defineComponent({ setup() { api = useCreateQuestions(); return () => null } }))
  await flushPromises()
  return api
}
const envoyees = () => h.updateEvaluation.mock.calls[0][1].questions[0]

beforeEach(() => {
  vi.clearAllMocks()
  h.getEvaluations.mockResolvedValue({ success: true, data: [{ id: 5, titre: 'Éval', matiere: { id: 1 }, classe: { id: 2 } }] })
  h.updateEvaluation.mockResolvedValue({ success: true })
})

describe('useCreateQuestions — bornes des options (B5)', () => {
  it('le 27e ajout est refusé ; à 25, l’ajout passe', async () => {
    const c = await ouvrir(n(25))
    c.addOption(0)
    expect(c.questions.value[0].options).toHaveLength(26)
    c.addOption(0)
    expect(c.questions.value[0].options).toHaveLength(26)
  })

  it('chargée à 27 options : refusée et le dit, puis acceptée une option retirée', async () => {
    const c = await ouvrir(n(27))
    expect(c.isValid.value).toBe(false)
    await c.saveQuestions()
    expect(h.updateEvaluation).not.toHaveBeenCalled()
    expect(h.toast.warning).toHaveBeenCalledWith(HORS_BORNES)
    c.removeOption(0, 26)
    expect(c.isValid.value).toBe(true)
    await c.saveQuestions()
    expect(envoyees().options).toHaveLength(26)
  })

  it('chargée avec une option de 1 001 caractères : refusée, puis acceptée raccourcie, sans troncature muette', async () => {
    const c = await ouvrir(['A'.repeat(1001), 'B'])
    expect(c.questions.value[0].options[0]).toHaveLength(1001)
    expect(c.isValid.value).toBe(false)
    await c.saveQuestions()
    expect(h.updateEvaluation).not.toHaveBeenCalled()
    c.questions.value[0].options[0] = 'A'.repeat(1000)
  // D466 (migration déclarée) : l'éditeur coche par POSITION ; la charge envoyée ne change pas.
    c.setCorrectAnswer(0, 0)
    expect(c.isValid.value).toBe(true)
  })

  it('témoin : 26 options de 1 000 caractères sont enregistrées', async () => {
    const c = await ouvrir(n(26, 1000))
    await c.saveQuestions()
    expect(h.toast.warning).not.toHaveBeenCalled()
    expect(envoyees().options).toHaveLength(26)
  })
})
