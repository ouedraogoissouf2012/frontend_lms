/**
 * Test des helpers purs evaluationResultAnswers (H2) : lecture de réponse,
 * exactitude par type, et classes d'option/vrai-faux selon la disponibilité de
 * correction. Toute la logique extraite de EvaluationResults.vue.
 */
import { describe, it, expect } from 'vitest'
import {
  getStudentAnswer,
  isCorrect,
  isOptionSelected,
  isOptionCorrect,
  getOptionClass,
  getOptionBorderClass,
  getOptionDotClass,
  isVraiFauxSelected,
  isVraiFauxCorrect,
  getVraiFauxClass,
} from '@/utils/evaluationResultAnswers'

describe('getStudentAnswer / isCorrect', () => {
  it('lit la réponse par id de question (fallback {})', () => {
    expect(getStudentAnswer({ 5: 'B' }, { id: 5 })).toBe('B')
    expect(getStudentAnswer(null, { id: 5 })).toBeUndefined()
  })

  it('qcm correct si réponse == correct_answers[0]', () => {
    const q = { id: 1, type: 'qcm', correct_answers: ['A'] }
    expect(isCorrect(q, { 1: 'A' })).toBe(true)
    expect(isCorrect(q, { 1: 'B' })).toBe(false)
  })

  it('qcm_multiple correct si ensembles égaux (ordre indifférent)', () => {
    const q = { id: 1, type: 'qcm_multiple', correct_answers: ['A', 'B'] }
    expect(isCorrect(q, { 1: ['B', 'A'] })).toBe(true)
    expect(isCorrect(q, { 1: ['A'] })).toBe(false)
    expect(isCorrect(q, { 1: 'A' })).toBe(false) // non-tableau
  })

  it('vrai_faux correct si réponse == correct_answers[0]', () => {
    const q = { id: 1, type: 'vrai_faux', correct_answers: ['Vrai'] }
    expect(isCorrect(q, { 1: 'Vrai' })).toBe(true)
  })

  it('réponse courte/dissertation → jamais auto-correct', () => {
    expect(isCorrect({ id: 1, type: 'reponse_courte' }, { 1: 'x' })).toBe(false)
  })
})

describe('isOptionSelected / isOptionCorrect', () => {
  const q = { id: 1, type: 'qcm', options: ['Paris', 'Lyon'], correct_answers: ['Paris'] }
  it('détecte la sélection par index ou texte', () => {
    expect(isOptionSelected(q, 0, { 1: 0 })).toBe(true)
    expect(isOptionSelected(q, 0, { 1: 'Paris' })).toBe(true)
    expect(isOptionSelected(q, 1, { 1: 'Paris' })).toBe(false)
  })
  it('détecte la bonne option par index ou texte', () => {
    expect(isOptionCorrect(q, 0)).toBe(true)
    expect(isOptionCorrect(q, 1)).toBe(false)
  })
})

describe('getOptionClass / border / dot (selon correction)', () => {
  const q = { id: 1, type: 'qcm', options: ['Paris', 'Lyon'], correct_answers: ['Paris'] }

  it('correction indisponible → classes d\'attente', () => {
    expect(getOptionClass(q, 0, { 1: 'Paris' }, false)).toBe('option-selected-waiting')
    expect(getOptionClass(q, 1, { 1: 'Paris' }, false)).toBe('option-not-selected-waiting')
    expect(getOptionBorderClass(q, 0, { 1: 'Paris' }, false)).toBe('border-blue-400')
    expect(getOptionDotClass(q, 0, false)).toBe('bg-blue-500')
  })

  it('correction disponible → correct / incorrect / neutral', () => {
    expect(getOptionClass(q, 0, { 1: 'Lyon' }, true)).toBe('option-correct')
    expect(getOptionClass(q, 1, { 1: 'Lyon' }, true)).toBe('option-incorrect')
    expect(getOptionClass(q, 1, { 1: 'Paris' }, true)).toBe('option-neutral')
    expect(getOptionDotClass(q, 0, true)).toBe('bg-green-500')
  })
})

describe('vrai/faux', () => {
  const q = { id: 1, type: 'vrai_faux', correct_answers: ['Vrai'] }
  it('sélection / exactitude / classe', () => {
    expect(isVraiFauxSelected(q, 'Vrai', { 1: 'Vrai' })).toBe(true)
    expect(isVraiFauxCorrect(q, 'Vrai')).toBe(true)
    expect(getVraiFauxClass(q, 'Vrai', { 1: 'Faux' }, true)).toBe('option-correct')
    expect(getVraiFauxClass(q, 'Faux', { 1: 'Faux' }, true)).toBe('option-incorrect')
    expect(getVraiFauxClass(q, 'Vrai', { 1: 'Vrai' }, false)).toBe('option-selected-waiting')
  })
})
