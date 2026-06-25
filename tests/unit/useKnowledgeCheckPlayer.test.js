/**
 * Test du composable useKnowledgeCheckPlayer (#G6 / H5) : machine à états
 * intro→playing→results, démarrage de tentative, sélection de réponse (unique &
 * multiple), navigation, soumission (émet « completed ») et reset. Service mocké.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const startAttempt = vi.fn()
const submitAttempt = vi.fn()
vi.mock('@/services/knowledgeCheck', () => ({
  default: {
    startAttempt: (...a) => startAttempt(...a),
    submitAttempt: (...a) => submitAttempt(...a)
  }
}))

import { useKnowledgeCheckPlayer } from '@/composables/useKnowledgeCheckPlayer'

const quiz = { id: 1, title: 'Quiz', passing_score: 70 }
const startData = {
  success: true,
  data: {
    time_limit_minutes: null,
    questions: [
      { question: 'Q1', type: 'single', options: ['a', 'b'] },
      { question: 'Q2', type: 'multiple', options: ['x', 'y', 'z'] }
    ]
  }
}

function setup() {
  let api
  const emit = vi.fn()
  const Comp = defineComponent({ setup() { api = useKnowledgeCheckPlayer({ quiz }, emit); return () => null } })
  mount(Comp)
  return { api, emit }
}

describe('useKnowledgeCheckPlayer (#G6 / H5)', () => {
  beforeEach(() => { startAttempt.mockReset(); submitAttempt.mockReset() })

  it('démarre en état intro sans appel service', () => {
    const { api } = setup()
    expect(api.state.value).toBe('intro')
    expect(startAttempt).not.toHaveBeenCalled()
  })

  it('startQuiz charge les questions et passe en playing', async () => {
    startAttempt.mockResolvedValue(startData)
    const { api } = setup()
    await api.startQuiz()
    await flushPromises()
    expect(startAttempt).toHaveBeenCalledWith(1)
    expect(api.state.value).toBe('playing')
    expect(api.questions.value).toHaveLength(2)
    expect(api.answers.value).toEqual([null, null])
  })

  it('selectOption (unique) et toggleOption (multiple) enregistrent les réponses', async () => {
    startAttempt.mockResolvedValue(startData)
    const { api } = setup()
    await api.startQuiz()
    api.selectOption(1)
    expect(api.answers.value[0]).toBe(1)
    api.goToQuestion(1)
    api.toggleOption(0)
    api.toggleOption(2)
    expect(api.answers.value[1]).toEqual([0, 2])
    api.toggleOption(0)
    expect(api.answers.value[1]).toEqual([2])
  })

  it('navigue entre questions sans déborder', async () => {
    startAttempt.mockResolvedValue(startData)
    const { api } = setup()
    await api.startQuiz()
    expect(api.currentIndex.value).toBe(0)
    api.previousQuestion()
    expect(api.currentIndex.value).toBe(0)
    api.nextQuestion()
    expect(api.currentIndex.value).toBe(1)
    api.nextQuestion()
    expect(api.currentIndex.value).toBe(1)
  })

  it('submitQuiz passe en results et émet « completed »', async () => {
    startAttempt.mockResolvedValue(startData)
    submitAttempt.mockResolvedValue({ success: true, data: { score: 90, passed: true } })
    const { api, emit } = setup()
    await api.startQuiz()
    await api.submitQuiz()
    await flushPromises()
    expect(api.state.value).toBe('results')
    expect(api.results.value.score).toBe(90)
    expect(emit).toHaveBeenCalledWith('completed', { score: 90, passed: true })
  })

  it('resetQuiz revient à l\'intro et vide l\'état', async () => {
    startAttempt.mockResolvedValue(startData)
    const { api } = setup()
    await api.startQuiz()
    api.resetQuiz()
    expect(api.state.value).toBe('intro')
    expect(api.questions.value).toEqual([])
    expect(api.currentIndex.value).toBe(0)
  })
})
