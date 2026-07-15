/**
 * Test de montage de la vue CreateQuestions (G3).
 * vue-router (useRoute/useRouter), evaluationService et klassciService mockés.
 * Mode création (pas de :id) avec klassci_id en query → chargement KLASSCI.
 * Vérifie le rendu de l'en-tête et l'ajout d'une question. Source intacte.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useRoute: () => ({ params: {}, query: { klassci_id: '42' } })
}))

vi.mock('@/services/klassci', () => ({
  default: {
    getEvaluations: vi.fn().mockResolvedValue({
      success: true,
      data: [{ id: 42, titre: 'Éval KLASSCI', matiere: { id: 1 }, classe: { id: 2 } }]
    }),
    getTeacherDashboard: vi.fn()
  }
}))

vi.mock('@/services/evaluation', () => ({
  default: { getEvaluation: vi.fn(), createEvaluation: vi.fn(), updateEvaluation: vi.fn(), publishEvaluation: vi.fn() }
}))

vi.mock('@/components/layout/DashboardLayout.vue', () => ({
  default: { name: 'DashboardLayout', template: '<div><slot /></div>' }
}))

vi.mock('@/components/evaluations/QuestionsConfigForm.vue', () => ({
  default: {
    name: 'QuestionsConfigForm',
    props: ['configuration'],
    template: '<section data-testid="questions-config-form" />'
  }
}))

vi.mock('@/components/evaluations/QuestionsEditorList.vue', () => ({
  default: {
    name: 'QuestionsEditorList',
    props: ['questions'],
    template: '<section data-testid="questions-editor-list" />'
  }
}))

import CreateQuestions from '@/views/evaluations/CreateQuestions.vue'

describe('CreateQuestions (G3) — montage', () => {
  it('monte en mode création et affiche le titre « Créer les questions QCM »', async () => {
    const w = mount(CreateQuestions)
    await flushPromises()
    expect(w.find('h1').text()).toContain('Créer les questions QCM')
  })

  it('addQuestion ajoute une question vide au state', async () => {
    const w = mount(CreateQuestions)
    await flushPromises()
    expect(w.vm.questions.length).toBe(0)
    w.vm.addQuestion()
    expect(w.vm.questions.length).toBe(1)
    expect(w.vm.questions[0]).toMatchObject({ type: 'qcm', points: 1 })
  })
})
