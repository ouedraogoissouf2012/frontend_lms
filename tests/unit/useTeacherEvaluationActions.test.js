/**
 * Test du composable useTeacherEvaluationActions (H1 ≤300) : modale de création
 * de version en ligne, garde anti-doublon, et actions (sync/publish/delete/nav).
 * Service evaluation + vue-router + alert/confirm mockés.
 */
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  push: vi.fn(),
  createEvaluation: vi.fn(),
  syncToKlassci: vi.fn(),
  publishEvaluation: vi.fn(),
  deleteEvaluation: vi.fn(),
  confirm: vi.fn(() => Promise.resolve(true)), // confirm() natif -> useConfirm().confirm() async (F3)
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: h.push }) }))
vi.mock('@/services/evaluation', () => ({
  default: {
    createEvaluation: h.createEvaluation,
    syncToKlassci: h.syncToKlassci,
    publishEvaluation: h.publishEvaluation,
    deleteEvaluation: h.deleteEvaluation
  }
}))
vi.mock('@/composables/useConfirm', () => ({
  useConfirm: () => ({ confirm: h.confirm, accept: vi.fn(), cancel: vi.fn(), state: {} }),
}))

import { useTeacherEvaluationActions } from '@/composables/useTeacherEvaluationActions'

function setup(evaluationsLMS = ref([])) {
  let api
  const loadEvaluationsLMS = vi.fn().mockResolvedValue()
  const Comp = defineComponent({
    setup() { api = useTeacherEvaluationActions({ evaluationsLMS, loadEvaluationsLMS }); return () => null }
  })
  mount(Comp)
  return { api, loadEvaluationsLMS, evaluationsLMS }
}

describe('useTeacherEvaluationActions (H1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.confirm.mockResolvedValue(true)
  })

  it('createOnlineVersion ouvre la modale avec l\'évaluation sélectionnée', () => {
    const { api } = setup()
    api.createOnlineVersion({ id: 1, titre: 'X' })
    expect(api.showCreateModal.value).toBe(true)
    expect(api.selectedEvaluation.value.id).toBe(1)
    expect(api.onlineForm.duree_minutes).toBe(60)
  })

  it('submit refuse si une version en ligne existe déjà', async () => {
    const evals = ref([{ klassci_evaluation_id: 1 }])
    const { api } = setup(evals)
    api.createOnlineVersion({ id: 1, titre: 'X' })
    await api.submitCreateOnlineVersion()
    expect(h.createEvaluation).not.toHaveBeenCalled()
    expect(api.showCreateModal.value).toBe(false)
  })

  it('submit crée la version en ligne et recharge', async () => {
    h.createEvaluation.mockResolvedValue({ success: true, data: { id: 9 } })
    const { api, loadEvaluationsLMS } = setup(ref([]))
    api.createOnlineVersion({ id: 1, titre: 'X', matiere: { id: 2 }, classe: { id: 3 } })
    api.onlineForm.type = 'mixte'
    await api.submitCreateOnlineVersion()
    expect(h.createEvaluation).toHaveBeenCalledTimes(1)
    const payload = h.createEvaluation.mock.calls[0][0]
    expect(payload.klassci_evaluation_id).toBe(1)
    expect(payload.type).toBe('mixte')
    expect(loadEvaluationsLMS).toHaveBeenCalled()
    expect(api.showCreateModal.value).toBe(false)
  })

  it('syncToKlassci sans soumission n\'appelle pas le service', async () => {
    const { api } = setup()
    await api.syncToKlassci({ id: 1, online_version: { id: 5, submissions_count: 0 } })
    expect(h.syncToKlassci).not.toHaveBeenCalled()
  })

  it('syncToKlassci avec soumissions + confirmation synchronise', async () => {
    h.syncToKlassci.mockResolvedValue({ success: true })
    const { api } = setup()
    await api.syncToKlassci({ id: 1, online_version: { id: 5, submissions_count: 3 } })
    expect(h.syncToKlassci).toHaveBeenCalledWith(5)
  })

  it('publishEvaluation sans question alerte et n\'appelle pas le service', async () => {
    const { api } = setup()
    await api.publishEvaluation({ id: 1, titre: 'X', online_version: { id: 5, questions_count: 0 } })
    expect(h.publishEvaluation).not.toHaveBeenCalled()
  })

  it('editOnlineVersion et previewEvaluation naviguent', () => {
    const { api } = setup()
    api.editOnlineVersion({ id: 1, online_version: { id: 5 } })
    expect(h.push).toHaveBeenCalledWith({ name: 'EditQuestions', params: { id: 5 }, query: { klassci_id: 1 } })
    api.previewEvaluation({ id: 1, online_version: { id: 5 } })
    expect(h.push).toHaveBeenCalledWith({ name: 'PreviewEvaluation', params: { id: 5 } })
  })
})
