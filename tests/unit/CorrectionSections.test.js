/**
 * Tests de montage des sous-composants de EvaluationCorrections (H2) :
 * EvalInfo / Stats / ResultsTable. Sections présentationnelles pures.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CorrectionEvalInfo from '@/components/evaluations/CorrectionEvalInfo.vue'
import CorrectionStats from '@/components/evaluations/CorrectionStats.vue'
import CorrectionResultsTable from '@/components/evaluations/CorrectionResultsTable.vue'

describe('CorrectionEvalInfo (H2)', () => {
  it('affiche matière, classe et coef/barème', () => {
    const w = mount(CorrectionEvalInfo, {
      props: { evaluation: { matiere: { nom: 'Maths' }, classe: { nom: '6e A' }, coefficient: 2, bareme: 20 } },
    })
    expect(w.text()).toContain('Maths')
    expect(w.text()).toContain('6e A')
    expect(w.text()).toContain('2 - 20/20')
  })
})

describe('CorrectionStats (H2)', () => {
  it('affiche les 4 valeurs principales', () => {
    const w = mount(CorrectionStats, {
      props: { statistiques: { total_etudiants: 30, etudiants_soumis: 28, moyenne_classe: 13, etudiants_en_cours: 1, taux_participation: 93 } },
    })
    const vals = w.findAll('.stat-value').map(n => n.text())
    expect(vals[0]).toBe('30')
    expect(vals[1]).toBe('28')
    expect(vals[2]).toContain('13')
    expect(vals[3]).toBe('1')
  })
})

describe('CorrectionResultsTable (H2)', () => {
  it('rend une ligne par résultat et émet export', async () => {
    const w = mount(CorrectionResultsTable, {
      props: { resultats: [
        { etudiant_id: 1, etudiant_nom_complet: 'Marie Curie', note: 16, status: 'soumis', attempt: 1 },
      ] },
    })
    expect(w.findAll('.table-row')).toHaveLength(1)
    expect(w.find('.student-avatar').text()).toBe('MC')
    expect(w.find('.note-badge').text()).toContain('16/20')
    await w.find('.btn-export').trigger('click')
    expect(w.emitted('export')).toBeTruthy()
  })

  it('affiche l\'état vide sans résultat', () => {
    const w = mount(CorrectionResultsTable, { props: { resultats: [] } })
    expect(w.find('.empty-results').exists()).toBe(true)
    expect(w.text()).toContain('Aucun résultat pour le moment')
  })
})
