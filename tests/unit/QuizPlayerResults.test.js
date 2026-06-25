/**
 * Test de montage de QuizPlayerResults (#G6 / H5) : score et entête réussite,
 * corrections (bonne réponse résolue via getAnswerText), et émission des actions
 * « retry » / « close ».
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import QuizPlayerResults from '@/components/lessons/QuizPlayerResults.vue'

const questions = [{ question: 'Q1', options: ['a', 'b', 'c'] }]
const results = {
  passed: true, score: 90, message: 'Bravo', correct_answers: 1,
  total_questions: 1, time_spent: '0:30', passing_score: 70, can_retry: true,
  answers: [{ question_index: 0, is_correct: false, correct_answer: 2, explanation: 'Parce que' }]
}

describe('QuizPlayerResults (#G6 / H5) — montage', () => {
  it('affiche le score et marque la réussite', () => {
    const w = mount(QuizPlayerResults, { props: { results, questions } })
    expect(w.find('.score-value').text()).toBe('90%')
    expect(w.find('.results-header').classes()).toContain('passed')
  })

  it('résout le texte de la bonne réponse dans les corrections', () => {
    const w = mount(QuizPlayerResults, { props: { results, questions } })
    expect(w.find('.corrections').text()).toContain('c') // options[2]
  })

  it('émet « retry » et « close »', async () => {
    const w = mount(QuizPlayerResults, { props: { results, questions } })
    await w.find('.retry-btn').trigger('click')
    expect(w.emitted('retry')).toBeTruthy()
    await w.find('.close-btn').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
