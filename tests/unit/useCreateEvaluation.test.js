/**
 * Test du composable useCreateEvaluation (H1 ≤300) : chargement KLASSCI,
 * gestion des questions/options/réponses correctes, validation et sauvegarde
 * (payload préparé). Services evaluation/klassci + vue-router mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCreate, mockPublish } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockPublish: vi.fn()
}))

vi.mock('@/services/evaluation', () => ({
  default: { createEvaluation: mockCreate, publishEvaluation: mockPublish }
}))
vi.mock('@/services/klassci', () => ({
  default: {
    getMatieres: () => Promise.resolve({ success: true, data: [{ id: 1, name: 'Maths' }] }),
    getClasses: () => Promise.resolve({ success: true, data: [{ id: 2, libelle: '6e A' }] }),
    getEvaluations: () => Promise.resolve({ success: true, data: [] })
  }
}))
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() })
}))

import { useCreateEvaluation } from '@/composables/useCreateEvaluation'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useCreateEvaluation(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useCreateEvaluation (H1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('alert', vi.fn())
  })

  it('charge matières et classes KLASSCI au montage', async () => {
    const c = await setup()
    expect(c.matieres.value).toEqual([{ id: 1, name: 'Maths' }])
    expect(c.classes.value).toEqual([{ id: 2, libelle: '6e A' }])
  })

  it('addQuestion / removeQuestion modifient la liste', async () => {
    const c = await setup()
    c.addQuestion()
    expect(c.questions.value).toHaveLength(1)
    expect(c.questions.value[0].type).toBe('qcm')
    expect(c.questions.value[0].options).toEqual(['', '', '', ''])
    c.removeQuestion(0)
    expect(c.questions.value).toHaveLength(0)
  })

  it('addOption / removeOption sur une question', async () => {
    const c = await setup()
    c.addQuestion()
    c.addOption(0)
    expect(c.questions.value[0].options).toHaveLength(5)
    c.removeOption(0, 0)
    expect(c.questions.value[0].options).toHaveLength(4)
  })

  it('setCorrectAnswer remplace, toggleCorrectAnswer bascule', async () => {
    const c = await setup()
    c.addQuestion()
    c.setCorrectAnswer(0, 'A')
    expect(c.questions.value[0].correct_answers).toEqual(['A'])
    c.toggleCorrectAnswer(0, 'B')
    expect(c.questions.value[0].correct_answers).toEqual(['A', 'B'])
    c.toggleCorrectAnswer(0, 'A')
    expect(c.questions.value[0].correct_answers).toEqual(['B'])
  })

  it('isValid exige champs requis + au moins une question', async () => {
    const c = await setup()
    expect(c.isValid.value).toBeFalsy()
    c.evaluation.klassci_matiere_id = 1
    c.evaluation.klassci_classe_id = 2
    c.evaluation.titre = 'Test'
    c.evaluation.duree_minutes = 60
    expect(c.isValid.value).toBeFalsy() // pas encore de question
    c.addQuestion()
    expect(c.isValid.value).toBeTruthy()
  })

  it('saveAsDraft refuse si invalide (alert, pas d\'appel service)', async () => {
    const c = await setup()
    await c.saveAsDraft()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('saveAndPublish envoie un payload préparé puis publie', async () => {
    mockCreate.mockResolvedValue({ success: true, data: { id: 99 } })
    mockPublish.mockResolvedValue({})
    const c = await setup()
    c.evaluation.klassci_matiere_id = 1
    c.evaluation.klassci_classe_id = 2
    c.evaluation.titre = 'Test'
    c.evaluation.duree_minutes = 60
    c.addQuestion()
    c.questions.value[0].question = 'Q1'
    c.questions.value[0].options = ['A', 'B', '']
    c.setCorrectAnswer(0, 'A')
    await c.saveAndPublish()
    expect(mockCreate).toHaveBeenCalledTimes(1)
    const payload = mockCreate.mock.calls[0][0]
    expect(payload.status).toBe('planifiee')
    expect(payload.questions[0].options).toEqual(['A', 'B']) // option vide filtrée
    expect(payload.questions[0].correct_answers).toEqual(['A'])
    expect(mockPublish).toHaveBeenCalledWith(99)
  })
})
