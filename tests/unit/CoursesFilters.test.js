/**
 * Test de rendu CoursesFilters (#G1 ≤300) : v-model matière/enseignant, émission
 * `apply` au @change des selects et `reset` au clic du bouton.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CoursesFilters from '@/components/student/CoursesFilters.vue'

const availableFilters = {
  matieres: [{ id: 'm1', name: 'Maths' }],
  enseignants: [{ id: 'e1', name: 'Prof X' }],
}

const mountFilters = (props = {}) =>
  mount(CoursesFilters, {
    props: { availableFilters, selectedMatiere: '', selectedEnseignant: '', ...props },
  })

describe('CoursesFilters (#G1)', () => {
  it('rend les options de matière et d\'enseignant', () => {
    const w = mountFilters()
    expect(w.html()).toContain('Maths')
    expect(w.html()).toContain('Prof X')
  })

  it('v-model émet update et apply au changement de matière', async () => {
    const w = mountFilters()
    const select = w.findAll('.filter-select')[0]
    await select.setValue('m1')
    expect(w.emitted('update:selectedMatiere')[0]).toEqual(['m1'])
    expect(w.emitted('apply')).toBeTruthy()
  })

  it('v-model émet update et apply au changement d\'enseignant', async () => {
    const w = mountFilters()
    const select = w.findAll('.filter-select')[1]
    await select.setValue('e1')
    expect(w.emitted('update:selectedEnseignant')[0]).toEqual(['e1'])
    expect(w.emitted('apply')).toBeTruthy()
  })

  it('affiche le bouton reset et émet reset au clic', async () => {
    const w = mountFilters({ selectedMatiere: 'm1' })
    const btn = w.find('.reset-filters-btn')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(w.emitted('reset')).toBeTruthy()
  })

  it('masque le bouton reset si aucun filtre actif', () => {
    const w = mountFilters()
    expect(w.find('.reset-filters-btn').exists()).toBe(false)
  })
})
