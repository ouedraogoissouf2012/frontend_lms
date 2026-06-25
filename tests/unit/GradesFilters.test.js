/**
 * Test de GradesFilters (#H10 ≤300) : les champs recherche/type/matière/tri sont
 * en v-model (defineModel) et émettent update:* ; le bouton « Exporter PDF » émet
 * l'évènement `export` délégué au parent.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import GradesFilters from '@/components/student/GradesFilters.vue'

const matieres = [
  { matiere_id: 1, matiere_nom: 'Mathématiques' },
  { matiere_id: 2, matiere_nom: 'Physique' },
]

const mountFilters = (props = {}) =>
  mount(GradesFilters, {
    props: {
      searchQuery: '',
      filterType: '',
      filterMatiere: '',
      sortBy: 'date-desc',
      matieres,
      ...props,
    },
  })

describe('GradesFilters (#H10)', () => {
  it('émet update:searchQuery quand on tape une recherche', async () => {
    const w = mountFilters()
    await w.find('.filter-input').setValue('algèbre')
    expect(w.emitted('update:searchQuery')[0]).toEqual(['algèbre'])
  })

  it('émet update:filterType quand on choisit un type', async () => {
    const w = mountFilters()
    const typeSelect = w.findAll('.filter-select')[0]
    await typeSelect.setValue('examen')
    expect(w.emitted('update:filterType')[0]).toEqual(['examen'])
  })

  it('rend une option par matière fournie', () => {
    const w = mountFilters()
    const matiereSelect = w.findAll('.filter-select')[1]
    const options = matiereSelect.findAll('option')
    // 1 option « Toutes les matières » + 2 matières
    expect(options).toHaveLength(3)
    expect(w.text()).toContain('Mathématiques')
    expect(w.text()).toContain('Physique')
  })

  it('émet export au clic sur le bouton Exporter PDF', async () => {
    const w = mountFilters()
    await w.find('.btn-export').trigger('click')
    expect(w.emitted('export')).toHaveLength(1)
  })
})
