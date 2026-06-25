/**
 * Test du composable useKnowledgeCheckEditor (#G6 / H5) : état initial du quiz,
 * mode édition (hydratation depuis existingQuiz), validation globale, ajout /
 * suppression de questions et sauvegarde (create vs update). Service mocké.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const create = vi.fn().mockResolvedValue({ data: { id: 1 } })
const update = vi.fn().mockResolvedValue({ data: { id: 7 } })
vi.mock('@/services/knowledgeCheck', () => ({
  default: {
    createEmptyQuestion: vi.fn((type = 'single') => ({
      question: '', type, options: ['', ''],
      correct_answer: type === 'multiple' ? [] : null, explanation: '', points: 1
    })),
    create: (...a) => create(...a),
    update: (...a) => update(...a)
  }
}))

import { useKnowledgeCheckEditor } from '@/composables/useKnowledgeCheckEditor'

function setup(props = { chapterId: 42, existingQuiz: null }) {
  let api
  const emit = vi.fn()
  const Comp = defineComponent({ setup() { api = useKnowledgeCheckEditor(props, emit); return () => null } })
  mount(Comp)
  return { api, emit }
}

describe('useKnowledgeCheckEditor (#G6 / H5)', () => {
  beforeEach(() => { create.mockClear(); update.mockClear() })

  it('initialise un quiz vide lié au chapitre, non éditable', () => {
    const { api } = setup()
    expect(api.quiz.value.chapter_id).toBe(42)
    expect(api.quiz.value.passing_score).toBe(70)
    expect(api.isEditing.value).toBe(false)
    expect(api.isValid.value).toBe(false) // titre + questions manquants
  })

  it('hydrate depuis existingQuiz et passe en mode édition', () => {
    const { api } = setup({ chapterId: 42, existingQuiz: { id: 7, title: 'X', questions: [] } })
    expect(api.isEditing.value).toBe(true)
    expect(api.quiz.value.title).toBe('X')
  })

  it('addQuestion ajoute une question vide, removeQuestion la retire', () => {
    const { api } = setup()
    api.addQuestion()
    expect(api.quiz.value.questions).toHaveLength(1)
    api.removeQuestion(0)
    expect(api.quiz.value.questions).toHaveLength(0)
  })

  it('isValid devient vrai quand titre + question complète sont fournis', () => {
    const { api } = setup()
    api.quiz.value.title = 'Quiz'
    api.addQuestion()
    const q = api.quiz.value.questions[0]
    q.question = 'Q1'
    q.options = ['A', 'B']
    q.correct_answer = 0
    expect(api.isValid.value).toBe(true)
  })

  it('save appelle create en création et émet « saved »', async () => {
    const { api, emit } = setup()
    api.quiz.value.title = 'Quiz'
    api.addQuestion()
    const q = api.quiz.value.questions[0]
    q.question = 'Q1'; q.options = ['A', 'B']; q.correct_answer = 0
    await api.save()
    await flushPromises()
    expect(create).toHaveBeenCalledTimes(1)
    expect(emit).toHaveBeenCalledWith('saved', { id: 1 })
  })

  it('save appelle update en édition', async () => {
    const { api } = setup({ chapterId: 42, existingQuiz: { id: 7, title: 'X', questions: [] } })
    api.quiz.value.title = 'X'
    api.addQuestion()
    const q = api.quiz.value.questions[0]
    q.question = 'Q1'; q.options = ['A', 'B']; q.correct_answer = 0
    await api.save()
    await flushPromises()
    expect(update).toHaveBeenCalledWith(7, api.quiz.value)
  })
})
