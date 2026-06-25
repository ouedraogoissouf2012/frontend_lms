/**
 * Test de rendu GradesTable (#H10 ≤300) : une ligne par évaluation, formats
 * appliqués (type/note/coefficient) et clic « Voir » qui émet `view` avec
 * l'evaluation_id. Présentation pure, formats issus des utils studentGrades.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import GradesTable from '@/components/student/GradesTable.vue'

const filteredEvaluations = [
  {
    evaluation_id: 101,
    matiere_nom: 'Mathématiques',
    titre: 'Devoir 1',
    type: 'devoir',
    note: '16',
    coefficient: 2,
    date_evaluation: '2026-02-01',
    temps_passe: 90,
  },
  {
    evaluation_id: 102,
    matiere_nom: 'Physique',
    titre: 'Examen',
    type: 'examen',
    note: '8',
    coefficient: 3,
    date_evaluation: '2026-03-01',
    temps_passe: 45,
  },
]

const mountTable = (props = {}) =>
  mount(GradesTable, { props: { filteredEvaluations, ...props } })

describe('GradesTable (#H10)', () => {
  it('rend une ligne par évaluation', () => {
    const w = mountTable()
    expect(w.findAll('.evaluation-row')).toHaveLength(2)
    expect(w.text()).toContain('Mathématiques')
    expect(w.text()).toContain('Physique')
  })

  it('affiche le compteur dans le titre', () => {
    const w = mountTable()
    expect(w.find('.table-title').text()).toContain('(2)')
  })

  it('applique le format de type et la classe de note', () => {
    const w = mountTable()
    const text = w.text()
    expect(text).toContain('Devoir')   // formatType('devoir')
    expect(text).toContain('Examen')   // formatType('examen')
    // note 16 → note-excellent, note 8 → note-fail
    const notes = w.findAll('.note-value')
    expect(notes[0].classes()).toContain('note-excellent')
    expect(notes[1].classes()).toContain('note-fail')
  })

  it('affiche le coefficient et la durée formatée', () => {
    const w = mountTable()
    const text = w.text()
    expect(text).toContain('× 2')
    expect(text).toContain('1h30') // formatTemps(90)
    expect(text).toContain('45 min') // formatTemps(45)
  })

  it('émet view avec l\'evaluation_id au clic sur Voir', async () => {
    const w = mountTable()
    await w.findAll('.btn-view')[0].trigger('click')
    expect(w.emitted('view')[0]).toEqual([101])
  })
})
