/**
 * Test de rendu EvaluationResultsTable (#H3 ≤300) : une ligne par résultat,
 * application des helpers statut/note, état vide, et émission de l'événement export.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EvaluationResultsTable from '@/components/admin/EvaluationResultsTable.vue'

const helpers = {
  getStatusClass: () => 'status-success',
  getStatusLabel: (s) => (s === 'soumis' ? 'Soumis' : s),
  getNoteClass: () => 'note-good',
  formatDateTime: () => '01/01/2026',
}

const resultats = [
  { etudiant_id: 1, etudiant_nom_complet: 'Aline', status: 'soumis', note: 15, score: 30, submitted_at: '2026-01-01', attempt: 1 },
  { etudiant_id: 2, etudiant_nom_complet: 'Bob', status: 'soumis', note: null, score: null, submitted_at: null, attempt: null },
]

const mountTable = (props = {}) =>
  mount(EvaluationResultsTable, { props: { resultats, ...helpers, ...props } })

describe('EvaluationResultsTable (#H3)', () => {
  it('rend une ligne par résultat avec libellé de statut', () => {
    const w = mountTable()
    expect(w.findAll('tbody tr')).toHaveLength(2)
    expect(w.html()).toContain('Aline')
    expect(w.find('.status-badge').text()).toBe('Soumis')
  })

  it('affiche "-" pour une note absente', () => {
    const w = mountTable()
    expect(w.findAll('.note-value')[1].text()).toBe('-')
  })

  it('affiche l\'état vide quand la liste est vide', () => {
    const w = mountTable({ resultats: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
    expect(w.find('.empty-text').text()).toBe('Aucun résultat disponible')
  })

  it('émet export au clic sur le bouton CSV', async () => {
    const w = mountTable()
    await w.find('.btn-export').trigger('click')
    expect(w.emitted('export')).toBeTruthy()
  })
})
