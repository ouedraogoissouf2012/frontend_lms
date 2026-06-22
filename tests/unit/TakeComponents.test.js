/**
 * Tests de montage des sous-composants de TakeEvaluation (H1) : bandeaux,
 * en-tête/minuteur/progression, carte de question (5 types) et modales.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TakeEvaluationBanners from '@/components/evaluations/TakeEvaluationBanners.vue'
import TakeEvaluationHeader from '@/components/evaluations/TakeEvaluationHeader.vue'
import TakeQuestionCard from '@/components/evaluations/TakeQuestionCard.vue'
import TakeEvaluationActions from '@/components/evaluations/TakeEvaluationActions.vue'
import TakeResultModals from '@/components/evaluations/TakeResultModals.vue'

const fmtLeft = (m) => `${m} min`

describe('TakeEvaluationBanners (H1)', () => {
  it('affiche le bandeau entraînement et l\'alerte urgente', () => {
    const w = mount(TakeEvaluationBanners, {
      props: { isPractice: true, windowTimeLeft: 3, formatTimeLeft: fmtLeft }
    })
    expect(w.find('.practice-banner').exists()).toBe(true)
    expect(w.find('.alert-urgent').exists()).toBe(true)
    expect(w.find('.alert-info').exists()).toBe(false)
  })

  it('affiche le compte à rebours quand windowTimeLeft > 5', () => {
    const w = mount(TakeEvaluationBanners, {
      props: { isPractice: false, windowTimeLeft: 20, formatTimeLeft: fmtLeft }
    })
    expect(w.find('.alert-urgent').exists()).toBe(false)
    expect(w.find('.alert-info').text()).toContain('20 min')
  })
})

describe('TakeEvaluationHeader (H1)', () => {
  it('rend le titre, le minuteur et la largeur de progression', () => {
    const w = mount(TakeEvaluationHeader, {
      props: {
        evaluation: { titre: 'Eval', questions: [{}, {}] },
        timeRemaining: 90,
        answeredCount: 1,
        progressPercentage: 50,
        formatTime: () => '01:30'
      }
    })
    expect(w.text()).toContain('Eval')
    expect(w.find('.timer-value').text()).toBe('01:30')
    expect(w.find('.timer-warning').exists()).toBe(true)
    expect(w.find('.progress-fill').attributes('style')).toContain('width: 50%')
  })
})

describe('TakeQuestionCard (H1)', () => {
  const base = {
    index: 0,
    answers: {},
    isAnswered: () => false,
    isOptionSelected: () => false
  }

  it('rend un QCM simple et marque la réponse', () => {
    const w = mount(TakeQuestionCard, {
      props: {
        ...base,
        question: { id: 'q1', type: 'qcm', points: 1, question: 'Q1', options: ['A', 'B'] },
        answers: { q1: 'A' }
      }
    })
    expect(w.findAll('.option-item').length).toBe(2)
    expect(w.find('.option-selected').exists()).toBe(true)
    expect(w.text()).toContain('Question 1')
  })

  it('émet toggle-multiple au changement d\'une case', async () => {
    const w = mount(TakeQuestionCard, {
      props: {
        ...base,
        question: { id: 'q2', type: 'qcm_multiple', points: 2, question: 'Q2', options: ['X', 'Y'] }
      }
    })
    await w.findAll('input[type="checkbox"]')[1].trigger('change')
    expect(w.emitted('toggle-multiple')[0]).toEqual(['q2', 'Y'])
  })

  it('rend une zone de texte pour la dissertation', () => {
    const w = mount(TakeQuestionCard, {
      props: {
        ...base,
        question: { id: 'q3', type: 'dissertation', points: 5, question: 'Q3' }
      }
    })
    expect(w.find('textarea.textarea-input').exists()).toBe(true)
  })
})

describe('TakeEvaluationActions (H1)', () => {
  it('émet cancel et submit ; libellé entraînement', async () => {
    const w = mount(TakeEvaluationActions, {
      props: { submitting: false, isPractice: true }
    })
    expect(w.find('.btn-submit').text()).toContain('Terminer l\'entraînement')
    await w.find('.btn-cancel').trigger('click')
    await w.find('.btn-submit').trigger('click')
    expect(w.emitted('cancel')).toBeTruthy()
    expect(w.emitted('submit')).toBeTruthy()
  })
})

describe('TakeResultModals (H1)', () => {
  const evaluation = { questions: [{}, {}] }

  it('confirme la soumission et émet submit/close-confirm', async () => {
    const w = mount(TakeResultModals, {
      props: {
        showConfirmModal: true, showResultsModal: false,
        evaluation, answeredCount: 1, results: null, isPractice: false
      }
    })
    expect(w.find('.modal-warning').exists()).toBe(true)
    await w.findAll('.modal-actions button')[1].trigger('click')
    expect(w.emitted('submit')).toBeTruthy()
  })

  it('affiche les résultats et émet return', async () => {
    const w = mount(TakeResultModals, {
      props: {
        showConfirmModal: false, showResultsModal: true,
        evaluation, answeredCount: 2,
        results: { note_sur_20: 18, score: 9 }, isPractice: false
      }
    })
    expect(w.find('.score-value').text()).toContain('18')
    await w.find('.btn-full').trigger('click')
    expect(w.emitted('return')).toBeTruthy()
  })
})
