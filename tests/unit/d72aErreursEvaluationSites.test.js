/**
 * D72-a (ARRÊT 1 validé) — chaque écran qui crée, met à jour, publie ou supprime une évaluation dit
 * le motif du catalogue (`err.userMessage`, posé par l'intercepteur ou par `invalidResponseError`),
 * jamais `err.response.data.message` (D0). Création réussie puis publication refusée : l'évaluation
 * EXISTE ; on le dit, sans le toast « Erreur d'enregistrement » et sans nouvel essai (qui mènerait
 * au 409).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  route: { query: { klassci_id: '5' }, params: {} },
  push: vi.fn(), back: vi.fn(),
  svc: {
    createEvaluation: vi.fn(), updateEvaluation: vi.fn(), publishEvaluation: vi.fn(), deleteEvaluation: vi.fn(),
    getEvaluation: vi.fn(), previewEvaluation: vi.fn(), syncToKlassci: vi.fn(),
  },
  getEvaluations: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))
vi.mock('vue-router', () => ({ useRoute: () => h.route, useRouter: () => ({ push: h.push, back: h.back }) }))
vi.mock('@/services/evaluation', () => ({ default: h.svc }))
vi.mock('@/services/klassci', () => ({ default: { getEvaluations: (...a) => h.getEvaluations(...a), getTeacherDashboard: vi.fn() } }))
vi.mock('@/composables/useToast', () => ({ toast: h.toast }))
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: () => Promise.resolve(true) }) }))

import { useTeacherEvaluationActions } from '@/composables/useTeacherEvaluationActions'
import { useCreateQuestions } from '@/composables/useCreateQuestions'
import { usePreviewEvaluation } from '@/composables/usePreviewEvaluation'

const SERVEUR = 'TEXTE SERVEUR'
const MOTIF = 'Motif du catalogue.'
const refus = (status) => ({ response: { status, data: { message: SERVEUR } }, userMessage: MOTIF })

async function monter(fabrique) {
  let api
  mount(defineComponent({ setup() { api = fabrique(); return () => null } }))
  await flushPromises()
  return api
}
const erreurs = () => h.toast.error.mock.calls.map((c) => String(c[0]))

beforeEach(() => {
  vi.clearAllMocks()
  h.route = { query: { klassci_id: '5' }, params: {} }
  h.getEvaluations.mockResolvedValue({ success: true, data: [{ id: 5, titre: 'Éval', matiere: { id: 1 }, classe: { id: 2 } }] })
})

describe('useTeacherEvaluationActions — le motif, jamais le texte du serveur', () => {
  const actions = () => {
    const loadEvaluationsLMS = vi.fn().mockResolvedValue()
    return { loadEvaluationsLMS, api: useTeacherEvaluationActions({ evaluationsLMS: ref([]), loadEvaluationsLMS }) }
  }
  const EVAL = { id: 1, titre: 'X', online_version: { id: 5, questions_count: 2 } }

  it('création refusée → le motif', async () => {
    h.svc.createEvaluation.mockRejectedValue(refus(403))
    const { api } = await monter(actions)
    api.createOnlineVersion({ id: 1, titre: 'X', matiere: { id: 1 }, classe: { id: 2 } })
    await api.submitCreateOnlineVersion()
    expect(erreurs()).toEqual([MOTIF])
  })

  it('création en 409 → recharge la liste, comme avant', async () => {
    h.svc.createEvaluation.mockRejectedValue(refus(409))
    const { api, loadEvaluationsLMS } = await monter(actions)
    api.createOnlineVersion({ id: 1, titre: 'X', matiere: { id: 1 }, classe: { id: 2 } })
    await api.submitCreateOnlineVersion()
    expect(loadEvaluationsLMS).toHaveBeenCalled()
    expect(erreurs().join()).not.toContain(SERVEUR)
  })

  it('publication refusée → le motif (D0)', async () => {
    h.svc.publishEvaluation.mockRejectedValue(refus(422))
    const { api } = await monter(actions)
    await api.publishEvaluation(EVAL)
    expect(erreurs()).toEqual([MOTIF])
  })

  it('suppression refusée → le motif (D0, D-a4)', async () => {
    h.svc.deleteEvaluation.mockRejectedValue(refus(403))
    const { api } = await monter(actions)
    await api.deleteEvaluation(EVAL)
    expect(erreurs()).toEqual([MOTIF])
  })
})

describe('useCreateQuestions — création et publication séparées', () => {
  async function pret() {
    const c = await monter(useCreateQuestions)
    c.addQuestion()
    c.questions.value[0].question = 'Q1'
    c.questions.value[0].options = ['A', 'B']
    c.setCorrectAnswer(0, 'A')
    return c
  }

  it('création OK, publication KO : ni « Erreur d’enregistrement » ni second POST ; on le dit et on revient à la liste', async () => {
    h.svc.createEvaluation.mockResolvedValue({ success: true, data: { id: 99 } })
    h.svc.publishEvaluation.mockRejectedValue(refus(422))
    const c = await pret()
    await c.saveQuestions()
    expect(h.svc.createEvaluation).toHaveBeenCalledTimes(1)
    expect(erreurs().join()).not.toMatch(/Erreur lors de l.enregistrement/)
    expect(erreurs().join()).toMatch(/enregistrée/)
    expect(erreurs().join()).toContain(MOTIF)
    expect(erreurs().join()).not.toContain(SERVEUR)
    expect(h.push).toHaveBeenCalledWith('/teacher/evaluations')
  })

  it('création refusée → le motif', async () => {
    h.svc.createEvaluation.mockRejectedValue(refus(422))
    const c = await pret()
    await c.saveQuestions()
    expect(erreurs()).toEqual([MOTIF])
    expect(h.svc.publishEvaluation).not.toHaveBeenCalled()
  })

  it('mise à jour refusée → le motif', async () => {
    h.route = { query: { klassci_id: '5' }, params: { id: '9' } }
    h.svc.getEvaluation.mockResolvedValue({ success: true, data: { id: 9, duree_minutes: 30, questions: [{ id: 1, question: 'Q', type: 'qcm', options: ['A', 'B'], correct_answers: ['A'], points: 1 }] } })
    h.svc.updateEvaluation.mockRejectedValue(refus(422))
    const c = await monter(useCreateQuestions)
    await c.saveQuestions()
    expect(h.svc.updateEvaluation).toHaveBeenCalledTimes(1)
    expect(erreurs()).toEqual([MOTIF])
  })
})

describe('usePreviewEvaluation — publication', () => {
  it('publication refusée → le motif', async () => {
    h.route = { query: {}, params: { id: '7' } }
    h.svc.previewEvaluation.mockResolvedValue({ success: true, data: { id: 7, questions_count: 1 } })
    h.svc.publishEvaluation.mockRejectedValue(refus(422))
    const c = await monter(usePreviewEvaluation)
    await c.publishEvaluation()
    expect(erreurs()).toEqual([MOTIF])
  })
})
