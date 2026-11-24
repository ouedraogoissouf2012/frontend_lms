/**
 * #599, les écrans d'évaluation : chacun dit le motif qu'il reçoit, jamais le texte du serveur (D0).
 * - Démarrage (`useStartEvaluation`) et remise (`useTakeEvaluation`) : `evaluation_attempt_conflict` (409), la copie est
 *   déjà remise par une autre requête. La remise affichait un texte FIXE pour tout refus autre que le verrou : elle
 *   dit désormais le motif connu, et garde ce texte pour le reste.
 * - Synchronisation (`useTeacherEvaluationActions`) : `evaluation_not_linked_to_klassci` (422).
 * Le catalogue lui-même : `motifs599.test.js`.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const h = vi.hoisted(() => ({
  svc: {
    getEvaluation: vi.fn(), submitEvaluation: vi.fn(), getTimeStatus: vi.fn(), getMySubmission: vi.fn(),
    startEvaluation: vi.fn(), syncToKlassci: vi.fn(),
  },
  push: vi.fn(),
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn(), warning: vi.fn() },
}))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '42' }, query: { submission_id: '7' } }),
  useRouter: () => ({ push: h.push, back: vi.fn() }),
}))
vi.mock('@/services/evaluation', () => ({ default: h.svc }))
vi.mock('@/services/api', () => ({ auth: { getUser: () => ({ id: 1, klassci_id: 3 }) } }))
vi.mock('@/composables/useToast', () => ({ toast: h.toast }))
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: () => Promise.resolve(true) }) }))

import { useStartEvaluation } from '@/composables/useStartEvaluation'
import { useTakeEvaluation } from '@/composables/useTakeEvaluation'
import { useTeacherEvaluationActions } from '@/composables/useTeacherEvaluationActions'

const SERVEUR = 'Texte fictif du serveur, jamais montré'
const refus = (status, reason) => ({ response: { status, data: { success: false, message: SERVEUR, reason }, headers: {} } })
const COPIE_DEJA_REMISE = "Votre copie vient d'être remise depuis une autre fenêtre ou un autre appareil. Rechargez l'évaluation."
const NON_LIEE = "Cette évaluation n'est liée à aucune évaluation KLASSCI : ses notes restent dans le LMS."
const T0 = Date.parse('2026-11-17T08:00:00Z')

async function monter(fabrique) {
  let api
  mount(defineComponent({ setup() { api = fabrique(); return () => null } }))
  await flushPromises()
  return api
}
const erreurs = () => h.toast.error.mock.calls.map((c) => String(c[0]))

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(T0)
  h.svc.getEvaluation.mockResolvedValue({
    success: true, data: { id: 42, titre: 'Devoir fictif', duree_minutes: 30, questions: [{ id: 'q1', type: 'qcm', points: 1, options: ['A', 'B'] }] },
  })
  h.svc.getMySubmission.mockResolvedValue({ success: true, data: { id: 7, status: 'en_cours', ends_at: new Date(T0 + 600_000).toISOString() } })
  h.svc.getTimeStatus.mockResolvedValue({ success: true, data: { server_time: new Date(T0).toISOString() } })
})
afterEach(() => { vi.useRealTimers() })

describe('#599 — evaluation_attempt_conflict (409) : la copie est déjà remise', () => {
  it('au démarrage : le texte du catalogue, pas « Impossible de démarrer »', async () => {
    h.svc.startEvaluation.mockRejectedValue(refus(409, 'evaluation_attempt_conflict'))
    const api = await monter(useStartEvaluation)
    await api.startEvaluation({ id: 42 })
    expect(erreurs()).toEqual([COPIE_DEJA_REMISE])
  })

  it('à la remise : le texte du catalogue, pas « Erreur lors de la soumission »', async () => {
    h.svc.submitEvaluation.mockRejectedValue(refus(409, 'evaluation_attempt_conflict'))
    const api = await monter(useTakeEvaluation)
    await api.submitEvaluation()
    expect(erreurs()).toEqual([COPIE_DEJA_REMISE])
  })

  it('à la remise, un refus sans motif connu garde le texte de l’écran, jamais celui du serveur', async () => {
    h.svc.submitEvaluation.mockRejectedValue(refus(500, undefined))
    const api = await monter(useTakeEvaluation)
    await api.submitEvaluation()
    expect(erreurs()).toEqual(['Erreur lors de la soumission de l\'évaluation'])
  })
})

describe('#599 — evaluation_not_linked_to_klassci (422) : la synchronisation le dit', () => {
  it('le texte du catalogue, pas « Erreur lors de la synchronisation »', async () => {
    h.svc.syncToKlassci.mockRejectedValue(refus(422, 'evaluation_not_linked_to_klassci'))
    const api = await monter(() => useTeacherEvaluationActions({ evaluationsLMS: ref([]), loadEvaluationsLMS: vi.fn() }))
    await api.syncToKlassci({ id: 1, online_version: { id: 5, submissions_count: 2 } })
    expect(erreurs()).toEqual([NON_LIEE])
  })
})
