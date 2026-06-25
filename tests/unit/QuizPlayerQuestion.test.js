/**
 * Test de montage de QuizPlayerQuestion (#G6 / H5) : rendu de la question
 * courante et de ses options, minuteur formaté, et émission des actions de
 * navigation/sélection (select, next, submit).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import QuizPlayerQuestion from '@/components/lessons/QuizPlayerQuestion.vue'

const base = {
  currentQuestion: { question: 'Q1', type: 'single', options: ['a', 'b'] },
  currentIndex: 0,
  questions: [{}, {}],
  answers: [null, null],
  progressPercent: 50,
  timeLimit: null,
  timeRemaining: 0,
  submitting: false
}

function mountQuestion(props = {}) {
  return mount(QuizPlayerQuestion, { props: { ...base, ...props } })
}

describe('QuizPlayerQuestion (#G6 / H5) — montage', () => {
  it('affiche l\'énoncé, les options et la progression', () => {
    const w = mountQuestion()
    expect(w.find('.question-text').text()).toBe('Q1')
    expect(w.findAll('.option-item')).toHaveLength(2)
    expect(w.find('.progress-text').text()).toBe('1 / 2')
  })

  it('affiche le minuteur formaté quand timeLimit est défini', () => {
    const w = mountQuestion({ timeLimit: 5, timeRemaining: 65 })
    expect(w.find('.quiz-timer').text()).toContain('1:05')
  })

  it('émet « select » au choix d\'une option (choix unique)', async () => {
    const w = mountQuestion()
    await w.findAll('input[type="radio"]')[1].trigger('change')
    expect(w.emitted('select')[0]).toEqual([1])
  })

  it('émet « next » puis « submit » selon la position', async () => {
    const w = mountQuestion()
    await w.find('.next-btn').trigger('click')
    expect(w.emitted('next')).toBeTruthy()
    const last = mountQuestion({ currentIndex: 1 })
    await last.find('.submit-btn').trigger('click')
    expect(last.emitted('submit')).toBeTruthy()
  })
})
