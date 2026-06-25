/**
 * Test de GradesSummary (#H10 ≤300) : une carte par matière (moyenne, min/max,
 * tendance via utils purs) et bascule de l'état d'ouverture en v-model
 * (defineModel) au clic sur l'en-tête → émet update:showSummary.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import GradesSummary from '@/components/student/GradesSummary.vue'

const matieres = [
  {
    matiere_id: 1,
    matiere_nom: 'Mathématiques',
    total_evaluations: 2,
    moyenne: 15,
    evaluations: [
      { note: '14', date_evaluation: '2026-02-01' },
      { note: '16', date_evaluation: '2026-03-01' },
    ],
  },
  {
    matiere_id: 2,
    matiere_nom: 'Physique',
    total_evaluations: 1,
    moyenne: 9,
    evaluations: [
      { note: '9', date_evaluation: '2026-02-15' },
    ],
  },
]

const mountSummary = (props = {}) =>
  mount(GradesSummary, { props: { matieres, showSummary: true, ...props } })

describe('GradesSummary (#H10)', () => {
  it('rend une carte par matière', () => {
    const w = mountSummary()
    expect(w.findAll('.summary-card')).toHaveLength(2)
    expect(w.text()).toContain('Mathématiques')
    expect(w.text()).toContain('Physique')
  })

  it('affiche la moyenne avec la classe couleur (getMoyenneClass)', () => {
    const w = mountSummary()
    const moyennes = w.findAll('.summary-moyenne')
    // 15 → note-good ; 9 → note-fail
    expect(moyennes[0].classes()).toContain('note-good')
    expect(moyennes[1].classes()).toContain('note-fail')
  })

  it('affiche min/max et la tendance (utils purs)', () => {
    const w = mountSummary()
    const text = w.text()
    expect(text).toContain('16/20') // getMaxNote maths
    expect(text).toContain('14/20') // getMinNote maths
    expect(text).toContain('En hausse') // tendance maths (14 → 16)
  })

  it('bascule showSummary au clic sur l\'en-tête (émet update:showSummary)', async () => {
    const w = mountSummary({ showSummary: true })
    await w.find('.section-header').trigger('click')
    expect(w.emitted('update:showSummary')[0]).toEqual([false])
  })

  it('affiche « Afficher » quand replié', () => {
    const w = mountSummary({ showSummary: false })
    expect(w.find('.toggle-hint').text()).toBe('Afficher')
  })
})
