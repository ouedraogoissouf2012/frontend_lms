/**
 * #570 : « Créer version en ligne » (école KLASSCI) créait l'évaluation puis ne menait nulle part : la redirection
 * vers l'éditeur de questions était en TODO, commentée. Une évaluation sans question ne peut pas être publiée
 * (422) : l'enseignant restait sans suite. Après la création, l'écran ouvre l'éditeur de la version créée, par la
 * MÊME route que « Modifier les questions » (`EditQuestions`, avec l'id KLASSCI de la programmation).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  push: vi.fn(),
  createEvaluation: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: h.push }) }))
vi.mock('@/services/evaluation', () => ({ default: { createEvaluation: h.createEvaluation } }))
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: vi.fn() }) }))
vi.mock('@/composables/useToast', () => ({ toast: h.toast }))

import { useTeacherEvaluationActions } from '@/composables/useTeacherEvaluationActions'

const PROGRAMMEE = { id: 9602, titre: 'Devoir K', matiere: { id: 9201 }, classe: { id: 9101 }, programmation: { date_evaluation: '2026-11-20' } }

function preparer() {
  let api
  const recharger = vi.fn()
  mount(defineComponent({ setup() { api = useTeacherEvaluationActions({ evaluationsLMS: ref([]), loadEvaluationsLMS: recharger }); return () => null } }))
  return api
}

beforeEach(() => { vi.clearAllMocks() })

describe('#570 — après « Créer version en ligne », l’éditeur de questions s’ouvre', () => {
  it('la version créée ouvre l’éditeur, avec l’id KLASSCI de la programmation', async () => {
    h.createEvaluation.mockResolvedValue({ success: true, data: { id: 77 } })
    const api = preparer()
    api.createOnlineVersion(PROGRAMMEE)
    await api.submitCreateOnlineVersion()
    await flushPromises()
    expect(h.push).toHaveBeenCalledWith({ name: 'EditQuestions', params: { id: 77 }, query: { klassci_id: 9602 } })
  })

  it('une création refusée ne mène nulle part', async () => {
    h.createEvaluation.mockRejectedValue({ response: { status: 409 } })
    const api = preparer()
    api.createOnlineVersion(PROGRAMMEE)
    await api.submitCreateOnlineVersion()
    await flushPromises()
    expect(h.push).not.toHaveBeenCalled()
  })

  it('une réponse sans id de la version créée : pas de navigation inventée', async () => {
    h.createEvaluation.mockResolvedValue({ success: true, data: {} })
    const api = preparer()
    api.createOnlineVersion(PROGRAMMEE)
    await api.submitCreateOnlineVersion()
    await flushPromises()
    expect(h.push).not.toHaveBeenCalled()
  })
})
