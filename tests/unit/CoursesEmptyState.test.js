/**
 * CoursesEmptyState (extrait de StudentCourses, #434) : message selon qu'un filtre est
 * actif ou non, et émission des deux actions.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CoursesEmptyState from '@/components/student/CoursesEmptyState.vue'

const monter = (filtered) => mount(CoursesEmptyState, { props: { filtered }, global: { stubs: { 'router-link': true } } })

describe('CoursesEmptyState (#434)', () => {
  it('sans filtre : dit que rien n’est publié, sans bouton « Effacer les filtres »', () => {
    const w = monter(false)
    expect(w.text()).toContain("Vos enseignants n'ont pas encore publié de cours.")
    expect(w.text()).not.toContain('Effacer les filtres')
  })

  it('avec filtre : dit qu’aucun cours ne correspond, et propose d’effacer', async () => {
    const w = monter(true)
    expect(w.text()).toContain('Aucun cours ne correspond à vos filtres.')
    await w.findAll('button')[0].trigger('click')
    expect(w.emitted('reset')).toHaveLength(1)
  })

  it('« Actualiser » émet reload', async () => {
    const w = monter(false)
    await w.find('button[aria-label="Actualiser la liste des cours"]').trigger('click')
    expect(w.emitted('reload')).toHaveLength(1)
  })
})
