/**
 * Test de montage de QuizPlayerCorrections (#G6 / H5) : rendu correct/incorrect,
 * résolution de la bonne réponse (getAnswerText, simple et multiple) et absence
 * de rendu quand il n'y a pas de réponses.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import QuizPlayerCorrections from '@/components/lessons/QuizPlayerCorrections.vue'

const questions = [
  { question: 'Q1', options: ['a', 'b', 'c'] },
  { question: 'Q2', options: ['x', 'y', 'z'] }
]

describe('QuizPlayerCorrections (#G6 / H5) — montage', () => {
  it('ne rend rien sans réponses', () => {
    const w = mount(QuizPlayerCorrections, { props: { answers: [], questions } })
    expect(w.find('.corrections').exists()).toBe(false)
  })

  it('affiche la bonne réponse résolue pour une réponse incorrecte', () => {
    const answers = [{ question_index: 0, is_correct: false, correct_answer: 2 }]
    const w = mount(QuizPlayerCorrections, { props: { answers, questions } })
    expect(w.find('.correction-item').classes()).toContain('incorrect')
    expect(w.find('.correction-body').text()).toContain('c') // options[2]
  })

  it('résout une bonne réponse multiple en liste de libellés', () => {
    const answers = [{ question_index: 1, is_correct: false, correct_answer: [0, 2] }]
    const w = mount(QuizPlayerCorrections, { props: { answers, questions } })
    expect(w.find('.correction-body').text()).toContain('x, z')
  })

  it('marque une réponse correcte', () => {
    const answers = [{ question_index: 0, is_correct: true, correct_answer: 0 }]
    const w = mount(QuizPlayerCorrections, { props: { answers, questions } })
    expect(w.find('.correction-item').classes()).toContain('correct')
  })
})
