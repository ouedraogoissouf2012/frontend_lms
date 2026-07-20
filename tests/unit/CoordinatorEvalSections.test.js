/**
 * Tests de montage des sous-composants de CoordinatorEvaluations (H2 ≤300) :
 * Stats / Filters / Card. Sections présentationnelles pures (props/v-model + emits).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CoordinatorEvalStats from '@/components/coordinateur/CoordinatorEvalStats.vue'
import CoordinatorEvalFilters from '@/components/coordinateur/CoordinatorEvalFilters.vue'
import CoordinatorEvalCard from '@/components/coordinateur/CoordinatorEvalCard.vue'

describe('CoordinatorEvalStats (H2)', () => {
  it('affiche les 4 valeurs de stats', () => {
    const w = mount(CoordinatorEvalStats, {
      props: { stats: { total: 12, enCours: 3, terminees: 5, avecVersionEnLigne: 2 } },
    })
    expect(w.findAll('.stat-value').map(n => n.text())).toEqual(['12', '3', '5', '2'])
  })
})

describe('CoordinatorEvalFilters (H2)', () => {
  const props = { filters: { enseignant_id: '', classe_id: '', matiere_id: '', statut: '' }, enseignants: [], classes: [], matieres: [] }

  it('émet apply au changement d\'un select', async () => {
    const w = mount(CoordinatorEvalFilters, { props })
    await w.find('select').trigger('change')
    expect(w.emitted('apply')).toBeTruthy()
  })

  it('émet reset au clic sur Réinitialiser', async () => {
    const w = mount(CoordinatorEvalFilters, { props })
    await w.find('.filter-reset-btn').trigger('click')
    expect(w.emitted('reset')).toBeTruthy()
  })
})

describe('CoordinatorEvalCard (H2)', () => {
  it('affiche titre/statut et émet view-results avec l\'id', async () => {
    const w = mount(CoordinatorEvalCard, {
      props: { evaluation: { id: 9, titre: 'Contrôle', status: 'terminee', duree_minutes: 45 } },
    })
    expect(w.find('.evaluation-title').text()).toBe('Contrôle')
    expect(w.find('.status-badge').text()).toContain('Terminée')
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('view-results')[0]).toEqual([9])
  })

  it('désactive « Détails » quand l\'évaluation n\'est pas terminée', () => {
    const w = mount(CoordinatorEvalCard, {
      props: { evaluation: { id: 1, titre: 'x', status: 'en_cours', duree_minutes: 30 } },
    })
    expect(w.find('.btn-secondary').attributes('disabled')).toBeDefined()
    expect(w.find('.btn-secondary').classes()).toContain('btn-disabled')
  })

  it('affiche les noms enrichis quand les relations imbriquées sont absentes', () => {
    const w = mount(CoordinatorEvalCard, {
      props: {
        evaluation: {
          id: 2,
          titre: 'x',
          status: 'terminee',
          duree_minutes: 30,
          enseignant_nom: 'BEDE ABEL TEST',
          matiere_nom: 'Marketing digital',
          classe_nom: 'B2 COM'
        }
      },
    })

    expect(w.text()).toContain('BEDE ABEL TEST')
    expect(w.text()).toContain('Marketing digital')
    expect(w.text()).toContain('B2 COM')
  })
})
