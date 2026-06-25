/**
 * Test de rendu CourseCard (#G1 ≤300) : titre + libellé de type, émission `select`
 * au clic, et troncature de la description.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CourseCard from '@/components/student/CourseCard.vue'

const baseCourse = {
  id: 'c1',
  title: 'Algèbre linéaire',
  type: 'tp',
  enseignant: { name: 'Prof X' },
  matiere: { name: 'Maths' },
}

const mountCard = (course = {}) =>
  mount(CourseCard, { props: { course: { ...baseCourse, ...course } } })

describe('CourseCard (#G1)', () => {
  it('rend le titre et le libellé de type', () => {
    const w = mountCard()
    expect(w.find('.course-title').text()).toBe('Algèbre linéaire')
    expect(w.find('.course-type-badge').text()).toBe('TP')
  })

  it('retombe sur "Cours" pour un type inconnu', () => {
    const w = mountCard({ type: 'inconnu' })
    expect(w.find('.course-type-badge').text()).toBe('Cours')
  })

  it('émet select au clic', async () => {
    const w = mountCard()
    await w.find('.course-card').trigger('click')
    expect(w.emitted('select')).toBeTruthy()
  })

  it('émet select au clavier (enter)', async () => {
    const w = mountCard()
    await w.find('.course-card').trigger('keydown.enter')
    expect(w.emitted('select')).toBeTruthy()
  })

  it('tronque une description trop longue', () => {
    const longText = 'a'.repeat(120)
    const w = mountCard({ description: longText })
    const rendered = w.find('.course-description').text()
    expect(rendered.endsWith('…')).toBe(true)
    expect(rendered).toHaveLength(81) // 80 + caractère ellipse
  })
})
