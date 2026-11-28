/**
 * Tests de montage des sous-composants de EvaluationResults (H2) :
 * ScoreHeader / QuestionCard / ChoiceOptions. Sections pures. Le compte à rebours de 7 jours a
 * disparu avec front#693 : le statut du corrigé est testé dans f693DiffusionDesResultats.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EvalResultScoreHeader from '@/components/evaluations/EvalResultScoreHeader.vue'
import ResultQuestionCard from '@/components/evaluations/ResultQuestionCard.vue'
import ResultChoiceOptions from '@/components/evaluations/ResultChoiceOptions.vue'

describe('EvalResultScoreHeader (H2)', () => {
  it('affiche note/score/coef et émet back', async () => {
    const w = mount(EvalResultScoreHeader, {
      props: { submission: { evaluation: { titre: 'Maths', coefficient: 2, show_results: true }, note_sur_20: 15, score: 30, submitted_at: '2026-03-01T10:00:00' } },
    })
    expect(w.find('h1').text()).toBe('Maths')
    expect(w.findAll('.score-value').map(n => n.text())).toEqual(['15/20', '30', '2'])
    await w.find('button').trigger('click')
    expect(w.emitted('back')).toBeTruthy()
  })
})

describe('ResultChoiceOptions (H2)', () => {
  it('rend les options QCM et marque bonne/mauvaise réponse en correction', () => {
    const q = { id: 1, type: 'qcm', options: ['Paris', 'Lyon'], correct_answers: ['Paris'] }
    const w = mount(ResultChoiceOptions, { props: { question: q, answers: { 1: 'Lyon' }, correctionAvailable: true } })
    expect(w.findAll('.option-text').map(n => n.text())).toEqual(['Paris', 'Lyon'])
    expect(w.find('.option-correct').exists()).toBe(true)
    expect(w.find('.option-incorrect').exists()).toBe(true)
  })
})

describe('ResultQuestionCard (H2)', () => {
  it('affiche le numéro et délègue les options de choix', () => {
    const q = { id: 1, type: 'qcm', question: 'Capitale ?', points: 2, options: ['Paris'], correct_answers: ['Paris'] }
    const w = mount(ResultQuestionCard, {
      props: { question: q, index: 0, answers: { 1: 'Paris' }, correctionAvailable: true },
    })
    expect(w.text()).toContain('Question 1')
    expect(w.findComponent(ResultChoiceOptions).exists()).toBe(true)
    expect(w.text()).toContain('Correct')
  })

  it('réponse courte : affiche la réponse étudiant et l état du corrigé si non corrigé', () => {
    const q = { id: 2, type: 'reponse_courte', question: 'Expliquez', points: 5 }
    const w = mount(ResultQuestionCard, {
      props: { question: q, index: 1, answers: { 2: 'Ma réponse' }, correctionAvailable: false, messageCorrige: 'Pas de corrigé prévu.' },
    })
    expect(w.text()).toContain('Ma réponse')
    expect(w.text()).toContain('Pas de corrigé prévu.')
  })
})
