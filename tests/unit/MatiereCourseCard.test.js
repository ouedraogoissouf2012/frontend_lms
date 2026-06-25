/**
 * Test de rendu de MatiereCourseCard (#H9). Titre, stats et emission navigate.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import MatiereCourseCard from '@/components/teacher/MatiereCourseCard.vue'

const matiere = {
  id: 1, name: 'Maths', coefficient: 3,
  statistiques: { nombre_lessons_publiees: 2, nombre_seances: 1, nombre_evaluations: 4 },
  classes: [{ id: 1, nom: '6e A' }]
}

describe('MatiereCourseCard (#H9)', () => {
  it('affiche le titre et le coefficient', () => {
    const w = mount(MatiereCourseCard, { props: { matiere } })
    expect(w.find('.course-title').text()).toBe('Maths')
    expect(w.text()).toContain('Coefficient: 3')
  })

  it('emet navigate au clic sur la carte', async () => {
    const w = mount(MatiereCourseCard, { props: { matiere } })
    await w.find('.course-card').trigger('click')
    expect(w.emitted('navigate')).toBeTruthy()
  })

  it('emet navigate au clic sur le bouton', async () => {
    const w = mount(MatiereCourseCard, { props: { matiere } })
    await w.find('.course-btn').trigger('click')
    expect(w.emitted('navigate')).toBeTruthy()
  })
})
