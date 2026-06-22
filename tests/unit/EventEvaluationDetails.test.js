/**
 * Test de EventEvaluationDetails (H8 ≤300) : champs éval + section résultat.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EventEvaluationDetails from '@/components/calendar/EventEvaluationDetails.vue'

describe('EventEvaluationDetails (H8)', () => {
  it('affiche matière, durée, barème, coefficient', () => {
    const w = mount(EventEvaluationDetails, {
      props: {
        eventData: { matiere_nom: 'Histoire', duree_minutes: 45, bareme: 20, coefficient: 2 },
        formattedDate: 'lundi 20 octobre 2025'
      }
    })
    const values = w.findAll('.detail-value').map(n => n.text())
    expect(values).toContain('Histoire')
    expect(values).toContain('45 minutes')
    expect(values).toContain('20/20')
    expect(values).toContain('2')
  })

  it('affiche la section résultat si une note est soumise', () => {
    const w = mount(EventEvaluationDetails, {
      props: { eventData: { student_submission: { note_sur_20: 15 } }, formattedDate: 'x' }
    })
    expect(w.find('.result-section').exists()).toBe(true)
    expect(w.find('.score-value').text()).toBe('15')
  })

  it('masque la section résultat sans note', () => {
    const w = mount(EventEvaluationDetails, { props: { eventData: {}, formattedDate: 'x' } })
    expect(w.find('.result-section').exists()).toBe(false)
  })
})
