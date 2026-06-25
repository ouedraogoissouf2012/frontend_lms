/**
 * Test de montage du sous-composant StudentEvaluationCard (H2 ≤300).
 * Composant présentationnel pur (prop evaluation + emits) extrait de
 * StudentEvaluations.vue. Vérifie le rendu (titre, statut) et les intentions émises.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import StudentEvaluationCard from '@/components/evaluations/StudentEvaluationCard.vue'

function mountCard(evaluation = {}) {
  return mount(StudentEvaluationCard, {
    props: { evaluation: { id: 1, titre: 'Contrôle 1', duree_minutes: 30, ...evaluation } },
  })
}

describe('StudentEvaluationCard (H2) — montage', () => {
  it('affiche le titre et le statut « Planifiée » par défaut', () => {
    const w = mountCard()
    expect(w.find('h3').text()).toBe('Contrôle 1')
    expect(w.text()).toContain('Planifiée')
  })

  it('sans soumission → bouton « Commencer » émet start', async () => {
    const w = mountCard({ status: 'en_cours' })
    const btn = w.find('button')
    expect(btn.text()).toContain("Commencer l'évaluation")
    await btn.trigger('click')
    expect(w.emitted('start')).toBeTruthy()
    expect(w.emitted('start')[0][0]).toMatchObject({ titre: 'Contrôle 1' })
  })

  it('soumission en cours → bouton « Continuer » émet continue', async () => {
    const w = mountCard({ student_submission: { status: 'en_cours' } })
    const btn = w.find('button')
    expect(btn.text()).toContain("Continuer l'évaluation")
    await btn.trigger('click')
    expect(w.emitted('continue')).toBeTruthy()
  })

  it('soumission soumise sans retake → bouton terminé désactivé, aucun emit', async () => {
    const w = mountCard({ student_submission: { status: 'soumis', note_sur_20: 15 } })
    const btn = w.find('button')
    expect(btn.text()).toContain('Évaluation terminée')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(w.text()).toContain('Note obtenue')
  })
})
