/**
 * Test de montage du sous-composant EvaluationCard (G3 — #28, tranche 3).
 * Composant présentationnel pur (props + emit) extrait de TeacherEvaluations.
 * Vérifie le rendu (titre, statut) et les intentions d'action émises selon
 * la présence d'une version en ligne. Parité : aucune source modifiée.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EvaluationCard from '@/components/evaluations/EvaluationCard.vue'

function mountCard(evaluation = {}, props = {}) {
  return mount(EvaluationCard, {
    props: {
      evaluation: { titre: 'Contrôle 1', status: 'planifiee', has_online: false, ...evaluation },
      ...props
    }
  })
}

describe('EvaluationCard (G3) — montage', () => {
  it('monte sans erreur et affiche le titre + le libellé de statut', () => {
    const w = mountCard()
    expect(w.find('.evaluation-card').exists()).toBe(true)
    expect(w.find('.eval-title').text()).toBe('Contrôle 1')
    expect(w.find('.status-badge').text()).toContain('Planifiée')
  })

  it('sans version en ligne → bouton « Créer version en ligne » qui émet create', async () => {
    const w = mountCard({ has_online: false })
    const btn = w.find('.btn-create')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(w.emitted('create')).toBeTruthy()
    expect(w.emitted('create')[0][0]).toMatchObject({ titre: 'Contrôle 1' })
  })

  it('avec version en ligne → bouton « Modifier les questions » qui émet edit', async () => {
    const w = mountCard({ has_online: true, online_version: { id: 9, is_published: true } })
    const btn = w.find('.btn-edit')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(w.emitted('edit')).toBeTruthy()
  })
})