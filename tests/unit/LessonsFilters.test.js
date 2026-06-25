/** Test de rendu LessonsFilters (#H4 ≤300) : options matières, v-model, apply/reset. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import LessonsFilters from '@/components/lessons/LessonsFilters.vue'

const mountFilters = (props = {}) =>
  mount(LessonsFilters, {
    props: { matiereId: '', status: '', type: '', matieres: [{ id: 7, name: 'Maths' }], ...props }
  })

describe('LessonsFilters (#H4)', () => {
  it('rend trois selects + les options de matières', () => {
    const w = mountFilters()
    expect(w.findAll('select')).toHaveLength(3)
    expect(w.html()).toContain('Maths')
  })

  it('émet apply au changement et reset au bouton', async () => {
    const w = mountFilters()
    await w.findAll('select')[1].setValue('draft')
    expect(w.emitted('update:status')[0]).toEqual(['draft'])
    expect(w.emitted('apply')).toBeTruthy()
    await w.find('.btn-reset').trigger('click')
    expect(w.emitted('reset')).toHaveLength(1)
  })
})
