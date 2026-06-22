/**
 * Tests de montage des sous-composants de PreviewEvaluation (H1) : stats,
 * progression, liste de questions (sélection QCM) et pied d'actions.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import PreviewStatsGrid from '@/components/evaluations/PreviewStatsGrid.vue'
import PreviewProgress from '@/components/evaluations/PreviewProgress.vue'
import PreviewQuestionsList from '@/components/evaluations/PreviewQuestionsList.vue'
import PreviewActionsFooter from '@/components/evaluations/PreviewActionsFooter.vue'

describe('PreviewStatsGrid (H1)', () => {
  it('affiche les 4 statistiques', () => {
    const w = mount(PreviewStatsGrid, {
      props: { evaluation: { duree_minutes: 30, questions_count: 5, total_points: 20, bareme: 20 } }
    })
    expect(w.findAll('.stat-card').length).toBe(4)
    expect(w.text()).toContain('30 min')
    expect(w.text()).toContain('20/20')
  })
})

describe('PreviewProgress (H1)', () => {
  it('rend la largeur de barre selon le pourcentage', () => {
    const w = mount(PreviewProgress, {
      props: { answeredCount: 1, questionsCount: 2, progressPercentage: 50 }
    })
    expect(w.text()).toContain('1/2 réponses simulées')
    expect(w.find('.progress-bar').attributes('style')).toContain('width: 50%')
  })
})

describe('PreviewQuestionsList (H1)', () => {
  it('émet "select" avec (questionId, option) au clic sur une option QCM', async () => {
    const questions = [{ id: 'q1', type: 'qcm', points: 1, question: 'Q1', options: ['A', 'B'] }]
    const w = mount(PreviewQuestionsList, { props: { questions, answers: {} } })
    await w.findAll('.option-button')[1].trigger('click')
    expect(w.emitted('select')[0]).toEqual(['q1', 'B'])
  })

  it('marque l\'option sélectionnée via answers', () => {
    const questions = [{ id: 'q1', type: 'qcm', points: 1, question: 'Q1', options: ['A', 'B'] }]
    const w = mount(PreviewQuestionsList, { props: { questions, answers: { q1: 'A' } } })
    expect(w.find('.option-selected').exists()).toBe(true)
  })
})

describe('PreviewActionsFooter (H1)', () => {
  it('publie/édite masqués si déjà publiée ; émet back', async () => {
    const w = mount(PreviewActionsFooter, { props: { isPublished: true, publishing: false } })
    expect(w.find('.btn-publish').exists()).toBe(false)
    expect(w.find('.btn-edit').exists()).toBe(false)
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('back')).toBeTruthy()
  })

  it('émet publish quand non publiée', async () => {
    const w = mount(PreviewActionsFooter, { props: { isPublished: false, publishing: false } })
    await w.find('.btn-publish').trigger('click')
    expect(w.emitted('publish')).toBeTruthy()
  })
})
