/**
 * D466 (D467) : l'éditeur ne produit plus de bonne réponse ORPHELINE (absente des options), que le
 * back refusera d'un 422 `correct_answer_not_among_options`. La coche suit l'option par sa POSITION ;
 * le texte n'est formé qu'à l'envoi, des seules options cochées encore remplies.
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
import { choixPourEnvoi } from '@/composables/useQuestionOptions'

const ORPHELINE = "La bonne réponse d'une question ne correspond à aucune de ses options. Choisissez-la de nouveau."

async function ouvrir(question) {
  h.getEvaluation.mockResolvedValue({ success: true, data: { id: 42, duree_minutes: 30, questions: [{ question: 'Q', type: 'qcm', points: 1, ...question }] } })
  let api
  mount(defineComponent({ setup() { api = useCreateQuestions(); return () => null } }))
  await flushPromises()
  return api
}
const envoyee = () => h.updateEvaluation.mock.calls[0][1].questions[0]

beforeEach(() => {
  vi.clearAllMocks()
  h.getEvaluations.mockResolvedValue({ success: true, data: [{ id: 5, titre: 'Éval', matiere: { id: 1 }, classe: { id: 2 } }] })
  h.updateEvaluation.mockResolvedValue({ success: true })
})

describe('useCreateQuestions — la bonne réponse suit son option (D466)', () => {
  it('renommer l’option cochée : la bonne réponse envoyée est le NOUVEAU texte', async () => {
    const c = await ouvrir({ options: ['Paris', 'Lyon'], correct_answers: ['Paris'] })
    c.questions.value[0].options[0] = 'Paris (capitale)'
    await c.saveQuestions()
    expect(envoyee().correct_answers).toEqual(['Paris (capitale)'])
  })

  it('supprimer l’option cochée : plus de bonne réponse envoyée', async () => {
    const c = await ouvrir({ options: ['A', 'B', 'C'], correct_answers: ['A'] })
    c.removeOption(0, 0)
    await c.saveQuestions()
    expect(envoyee().options).toEqual(['B', 'C'])
    expect(envoyee().correct_answers).toEqual([])
  })

  it('supprimer une option AVANT l’option cochée : la coche reste sur la bonne option', async () => {
    const c = await ouvrir({ options: ['A', 'B', 'C'], correct_answers: ['C'] })
    c.removeOption(0, 0)
    await c.saveQuestions()
    expect(envoyee().correct_answers).toEqual(['C'])
  })

  it('vider l’option cochée : elle n’est pas envoyée, sa coche non plus', async () => {
    const c = await ouvrir({ type: 'qcm_multiple', options: ['A', 'B', 'C'], correct_answers: ['A', 'C'] })
    c.questions.value[0].options[2] = ''
    await c.saveQuestions()
    expect(envoyee().options).toEqual(['A', 'B'])
    expect(envoyee().correct_answers).toEqual(['A'])
  })

  it('vider puis retaper l’option cochée : la coche reste', async () => {
    const c = await ouvrir({ options: ['Paris', 'Lyon'], correct_answers: ['Paris'] })
    c.questions.value[0].options[0] = ''
    c.questions.value[0].options[0] = 'Marseille'
    await c.saveQuestions()
    expect(envoyee().correct_answers).toEqual(['Marseille'])
  })

  it('une bonne réponse déjà orpheline : marquée, refusée, puis acceptée une fois choisie de nouveau', async () => {
    const c = await ouvrir({ options: ['A', 'B'], correct_answers: ['Z'] })
    expect(c.questions.value[0].bonneReponseOrpheline).toBe(true)
    expect(c.isValid.value).toBe(false)
    await c.saveQuestions()
    expect(h.updateEvaluation).not.toHaveBeenCalled()
    expect(h.toast.warning).toHaveBeenCalledWith(ORPHELINE)
    c.setCorrectAnswer(0, 1)
    expect(c.isValid.value).toBe(true)
    await c.saveQuestions()
    expect(envoyee().correct_answers).toEqual(['B'])
  })

  it('le 422 `correct_answer_not_among_options` du back : le texte du catalogue, jamais celui du serveur', async () => {
    h.updateEvaluation.mockRejectedValue(Object.assign(new Error('HTTP 422'), {
      response: { status: 422, data: { success: false, message: 'Texte serveur, jamais affiché', reason: 'correct_answer_not_among_options' } },
    }))
    const c = await ouvrir({ options: ['A', 'B'], correct_answers: ['A'] })
    await c.saveQuestions()
    expect(h.toast.error).toHaveBeenCalledWith(ORPHELINE)
  })
})

describe('choixPourEnvoi — les textes ne sont formés qu’à l’envoi (D466)', () => {
  it('les options remplies, et les textes des seules options cochées encore remplies', () => {
    expect(choixPourEnvoi({ type: 'qcm_multiple', options: ['A', '', 'C', ' '], correctes: [1, 2, 3] }))
      .toEqual({ options: ['A', 'C'], correct_answers: ['C'] })
  })
})
