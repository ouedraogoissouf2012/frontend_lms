/**
 * D528 (revue croisée de Fille 1, contre lms_backend #1071) : trois envois que #1071 refuserait d'un
 * 422 SANS motif sont rendus impossibles par l'éditeur, qui dit pourquoi, avec un texte du catalogue.
 * 1. Une question à plusieurs coches passée à un type à réponse UNIQUE : les coches sont retirées et la
 *    question attend sa bonne réponse. Jamais un choix fait en silence.
 * 2. Une réponse courte est découpée, nettoyée (vides, doublons) ; au-delà de 26 réponses, ou de 1 000
 *    caractères, elle est refusée avant l'envoi.
 * 3. Deux options au même texte (après trim) sont refusées avant l'envoi.
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

async function ouvrir(question) {
  h.getEvaluation.mockResolvedValue({ success: true, data: { id: 42, duree_minutes: 30, questions: [{ question: 'Q', type: 'qcm', points: 1, ...question }] } })
  let api
  mount(defineComponent({ setup() { api = useCreateQuestions(); return () => null } }))
  await flushPromises()
  return api
}
const envoyee = () => h.updateEvaluation.mock.calls[0][1].questions[0]

/** L'enregistrement est refusé AVANT l'envoi, avec ce texte. */
async function refusee(c, texte) {
  expect(c.isValid.value).toBe(false)
  await c.saveQuestions()
  expect(h.updateEvaluation).not.toHaveBeenCalled()
  expect(h.toast.warning).toHaveBeenCalledWith(texte)
}

beforeEach(() => {
  vi.clearAllMocks()
  h.getEvaluations.mockResolvedValue({ success: true, data: [{ id: 5, titre: 'Éval', matiere: { id: 1 }, classe: { id: 2 } }] })
  h.updateEvaluation.mockResolvedValue({ success: true })
})

// --- D528-1
const A_CHOISIR = "Cette question n'accepte qu'une bonne réponse : ses coches ont été retirées. Choisissez-la."

describe('D528-1 — un changement de type ne choisit jamais une bonne réponse en silence', () => {
  it('qcm_multiple à 2 coches passé en qcm : coches retirées, refusé, puis accepté une fois choisie', async () => {
    const c = await ouvrir({ type: 'qcm_multiple', options: ['A', 'B', 'C'], correct_answers: ['A', 'C'] })
    c.changeType(0, 'qcm')
    expect(c.questions.value[0].type).toBe('qcm')
    expect(c.questions.value[0].correctes).toEqual([])
    await refusee(c, A_CHOISIR)
    c.setCorrectAnswer(0, 1)
    expect(c.isValid.value).toBe(true)
    await c.saveQuestions()
    expect(envoyee().correct_answers).toEqual(['B'])
  })

  it('qcm_multiple à 2 coches passé en vrai_faux : le même refus', async () => {
    const c = await ouvrir({ type: 'qcm_multiple', options: ['Vrai', 'Faux'], correct_answers: ['Vrai', 'Faux'] })
    c.changeType(0, 'vrai_faux')
    await refusee(c, A_CHOISIR)
  })

  it('une seule coche, vers un type à réponse unique : elle est gardée (aucun refus inutile)', async () => {
    const c = await ouvrir({ type: 'qcm_multiple', options: ['A', 'B'], correct_answers: ['A'] })
    c.changeType(0, 'qcm')
    expect(c.isValid.value).toBe(true)
    await c.saveQuestions()
    expect(envoyee().correct_answers).toEqual(['A'])
  })

  it('qcm vers qcm_multiple : la coche est gardée', async () => {
    const c = await ouvrir({ options: ['A', 'B'], correct_answers: ['B'] })
    c.changeType(0, 'qcm_multiple')
    await c.saveQuestions()
    expect(envoyee().correct_answers).toEqual(['B'])
  })

  it('une question à choix marquée, passée en réponse courte : ses options ne partent pas, elle ne bloque plus', async () => {
    const c = await ouvrir({ options: ['A', 'B'], correct_answers: ['Z'] })
    expect(c.isValid.value).toBe(false)
    c.changeType(0, 'reponse_courte')
    c.questions.value[0].correct_answers_text = 'Paris'
    expect(c.isValid.value).toBe(true)
    await c.saveQuestions()
    expect(envoyee().correct_answers).toEqual(['Paris'])
  })
})
