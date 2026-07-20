/**
 * Test de rendu EvalResultsList (#H3 ≤300) : une carte par évaluation, badge de
 * statut, état vide, émission de view-results / view-details, et désactivation
 * du bouton « Prévisualiser » pour un coordinateur sur une évaluation non terminée.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EvalResultsList from '@/components/admin/EvalResultsList.vue'

const helpers = {
  getStatusClass: (s) => (s === 'terminee' ? 'status-completed' : 'status-active'),
  getStatusLabel: (s) => (s === 'terminee' ? 'Terminée' : 'En cours'),
  isEvaluationTerminee: (e) => (e.effective_status || e.status) === 'terminee',
  formatDate: () => '01/01/2026',
}

const evaluations = [
  { id: 1, titre: 'Eval A', enseignant_nom: 'Zoé', status: 'en_cours', duree_minutes: 60 },
  { id: 2, titre: 'Eval B', enseignant_nom: 'Alain', status: 'terminee', duree_minutes: 90 },
]

const mountList = (props = {}) =>
  mount(EvalResultsList, {
    props: { evaluations, isCoordinateur: false, ...helpers, ...props },
  })

describe('EvalResultsList (#H3)', () => {
  it('rend une carte par évaluation avec titre et badge', () => {
    const w = mountList()
    expect(w.findAll('.evaluation-card')).toHaveLength(2)
    expect(w.html()).toContain('Eval A')
    expect(w.findAll('.status-badge')[1].text()).toBe('Terminée')
  })

  it('affiche l’état vide quand aucune évaluation', () => {
    const w = mountList({ evaluations: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
    expect(w.find('.empty-text').text()).toBe('Aucune évaluation trouvée')
  })

  it('émet view-results et view-details avec l’id', async () => {
    const w = mountList()
    await w.findAll('.btn-primary')[0].trigger('click')
    expect(w.emitted('view-results')[0]).toEqual([1])
    await w.findAll('.btn-secondary')[0].trigger('click')
    expect(w.emitted('view-details')[0]).toEqual([1])
  })

  it('désactive Prévisualiser pour coordinateur sur évaluation non terminée', () => {
    const w = mountList({ isCoordinateur: true })
    const btns = w.findAll('.btn-secondary')
    expect(btns[0].classes()).toContain('btn-disabled') // en_cours -> désactivé
    expect(btns[1].classes()).not.toContain('btn-disabled') // terminee -> actif
  })

  it('affiche les noms enrichis même sans relations imbriquées', () => {
    const w = mountList({
      evaluations: [{
        id: 3,
        titre: 'Eval C',
        enseignant_nom: 'BEDE ABEL TEST',
        matiere_nom: 'Marketing digital',
        classe_nom: 'B2 COM',
        status: 'terminee',
        duree_minutes: 30
      }]
    })

    expect(w.text()).toContain('BEDE ABEL TEST')
    expect(w.text()).toContain('Marketing digital')
    expect(w.text()).toContain('B2 COM')
  })
})
