/**
 * B7 (#1059) : l'enseignant ouvre en édition une évaluation dont une question a des options
 * d'avant #1059 (nombre, null, objet, objet associatif). Aujourd'hui, l'enregistrement lève sur
 * `o.trim()` (ou `filter`). Attendu : lisible → enregistré en textes ; illisible → l'écran le dit,
 * l'enregistrement est refusé jusqu'à la ressaisie, et rien n'est fabriqué ni retiré en silence.
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

const ILLISIBLE = "Les options de cette question n'ont pas pu être relues. Saisissez-les de nouveau avant d'enregistrer."

async function ouvrir(question) {
  h.getEvaluation.mockResolvedValue({ success: true, data: { id: 42, duree_minutes: 30, questions: [{ question: 'Q', type: 'qcm', points: 1, ...question }] } })
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

describe('useCreateQuestions — options d’avant #1059 (B7)', () => {
  it('options numériques : enregistrées en textes, avec la bonne réponse qui correspond', async () => {
    const c = await ouvrir({ type: 'qcm_multiple', options: [1, 2, 3], correct_answers: [2] })
    await c.saveQuestions()
    expect(h.toast.error).not.toHaveBeenCalled()
    expect(envoyees().options).toEqual(['1', '2', '3'])
    expect(envoyees().correct_answers).toEqual(['2'])
  })

  it('une option null : retirée comme une option vide, sans planter', async () => {
    const c = await ouvrir({ options: ['A', null, 'B'], correct_answers: ['A'] })
    await c.saveQuestions()
    expect(h.toast.error).not.toHaveBeenCalled()
    expect(envoyees().options).toEqual(['A', 'B'])
  })

  it.each([
    ['un élément objet', [{ texte: 'A' }, 'B']],
    ['un objet associatif', { a: 'X', b: 'Y' }],
  ])('%s : illisible, l’enregistrement est refusé et le dit, puis passe après ressaisie', async (_, options) => {
    const c = await ouvrir({ options, correct_answers: ['B'] })
    expect(c.questions.value[0].optionsIllisibles).toBe(true)
    expect(JSON.stringify(c.questions.value[0].options)).not.toContain('[object Object]')
    expect(c.isValid.value).toBe(false)
    await c.saveQuestions()
    expect(h.updateEvaluation).not.toHaveBeenCalled()
    expect(h.toast.warning).toHaveBeenCalledWith(ILLISIBLE)

    c.questions.value[0].options = ['X', 'Y', '', '']
  // D466 (migration déclarée) : l'éditeur coche par POSITION ; la charge envoyée ne change pas.
    c.setCorrectAnswer(0, 0)
    expect(c.isValid.value).toBe(true)
    await c.saveQuestions()
    expect(envoyees().options).toEqual(['X', 'Y'])
    expect(envoyees().correct_answers).toEqual(['X'])
  })

  // D446 : une question illisible repart avec les options d'une question NEUVE de son type.
  it('un qcm illisible repart avec les options d’une question neuve (même source)', async () => {
    const c = await ouvrir({ options: [{ texte: 'A' }], correct_answers: [] })
    c.addQuestion()
    expect(c.questions.value[0].options).toEqual(c.questions.value[1].options)
  })

  it('un vrai/faux illisible repart avec « Vrai » et « Faux », ceux de la page de passage', async () => {
    const c = await ouvrir({ type: 'vrai_faux', options: { v: 'Vrai', f: 'Faux' }, correct_answers: ['Vrai'] })
    expect(c.questions.value[0].optionsIllisibles).toBe(true)
    expect(c.questions.value[0].options).toEqual(['Vrai', 'Faux'])
  })

  // D451 : illisible = refusé tant que la bonne réponse n'est pas choisie de nouveau.
  it('un vrai/faux illisible : refusé tant que la bonne réponse n’est pas choisie, puis accepté', async () => {
    const c = await ouvrir({ type: 'vrai_faux', options: [{ v: 1 }], correct_answers: ['Vrai'] })
    expect(c.isValid.value).toBe(false)
    await c.saveQuestions()
    expect(h.updateEvaluation).not.toHaveBeenCalled()
    expect(h.toast.warning).toHaveBeenCalledWith(ILLISIBLE)
  // D466 (migration déclarée) : l'éditeur coche par POSITION ; la charge envoyée ne change pas.
    c.setCorrectAnswer(0, 0)
    expect(c.isValid.value).toBe(true)
    await c.saveQuestions()
    expect(envoyees().options).toEqual(['Vrai', 'Faux'])
    expect(envoyees().correct_answers).toEqual(['Vrai'])
  })

  it('un qcm illisible : ses options ressaisies ne suffisent pas sans bonne réponse', async () => {
    const c = await ouvrir({ options: [{ texte: 'A' }], correct_answers: ['A'] })
    c.questions.value[0].options = ['X', 'Y', '', '']
    expect(c.isValid.value).toBe(false)
    await c.saveQuestions()
    expect(h.updateEvaluation).not.toHaveBeenCalled()
  // D466 (migration déclarée) : l'éditeur coche par POSITION ; la charge envoyée ne change pas.
    c.setCorrectAnswer(0, 1)
    expect(c.isValid.value).toBe(true)
  })

  it('verrou : des options en textes restent identiques', async () => {
    const c = await ouvrir({ options: ['A', 'B'], correct_answers: ['A'] })
    expect(c.questions.value[0].optionsIllisibles).toBe(false)
    await c.saveQuestions()
    expect(envoyees().options).toEqual(['A', 'B'])
    expect(envoyees().correct_answers).toEqual(['A'])
  })
})
