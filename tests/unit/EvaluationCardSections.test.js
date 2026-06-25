/**
 * Tests de montage des sous-composants d'EvaluationCard (H2 ≤300) :
 * Header / InfoGrid / Status / Actions. Sections présentationnelles pures
 * (props + emits) extraites verbatim. Le test racine reste EvaluationCard.test.js.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EvaluationCardHeader from '@/components/evaluations/EvaluationCardHeader.vue'
import EvaluationCardInfoGrid from '@/components/evaluations/EvaluationCardInfoGrid.vue'
import EvaluationCardStatus from '@/components/evaluations/EvaluationCardStatus.vue'
import EvaluationCardActions from '@/components/evaluations/EvaluationCardActions.vue'

describe('EvaluationCardHeader (H2)', () => {
  it('affiche le titre et le libellé de statut', () => {
    const w = mount(EvaluationCardHeader, { props: { evaluation: { titre: 'Contrôle 1', status: 'planifiee' } } })
    expect(w.find('.eval-title').text()).toBe('Contrôle 1')
    expect(w.find('.status-badge').text()).toContain('Planifiée')
  })

  it('affiche le badge « version en ligne » si has_online', () => {
    const w = mount(EvaluationCardHeader, { props: { evaluation: { titre: 'x', status: 'planifiee', has_online: true } } })
    expect(w.find('.online-badge').exists()).toBe(true)
  })
})

describe('EvaluationCardInfoGrid (H2)', () => {
  it('affiche matière, classe et le fallback date', () => {
    const w = mount(EvaluationCardInfoGrid, { props: { evaluation: { matiere: { nom: 'Maths' }, classe: { nom: '6e A' } } } })
    expect(w.text()).toContain('Maths')
    expect(w.text()).toContain('6e A')
    expect(w.text()).toContain('Non définie') // date absente
  })
})

describe('EvaluationCardStatus (H2)', () => {
  it('affiche « Prévue » quand la fenêtre n\'a pas démarré', () => {
    const w = mount(EvaluationCardStatus, { props: { evaluation: { programmation: { window: { has_started: false } } } } })
    expect(w.find('.status-pending').exists()).toBe(true)
    expect(w.text()).toContain('Prévue')
  })

  it('affiche le bloc « version en ligne » si online_version', () => {
    const w = mount(EvaluationCardStatus, { props: { evaluation: { has_online: true, online_version: { questions_count: 5, duree_minutes: 30 } } } })
    expect(w.find('.online-info').exists()).toBe(true)
    expect(w.text()).toContain('5 questions')
  })
})

describe('EvaluationCardActions (H2)', () => {
  it('sans version en ligne → btn-create émet create', async () => {
    const w = mount(EvaluationCardActions, { props: { evaluation: { id: 1, titre: 'x', has_online: false } } })
    await w.find('.btn-create').trigger('click')
    expect(w.emitted('create')).toBeTruthy()
  })

  it('avec version en ligne → btn-edit émet edit', async () => {
    const w = mount(EvaluationCardActions, { props: { evaluation: { id: 1, has_online: true, online_version: { is_published: true } } } })
    await w.find('.btn-edit').trigger('click')
    expect(w.emitted('edit')).toBeTruthy()
  })
})
