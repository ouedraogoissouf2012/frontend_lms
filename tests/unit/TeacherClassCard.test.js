/**
 * Test de rendu de TeacherClassCard (#H9). Nom, badge actif, stats.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TeacherClassCard from '@/components/teacher/TeacherClassCard.vue'

const classe = {
  id: 1, name: '6e A',
  niveau: { nom: 'Sixième' },
  filiere: { nom: 'Sciences', code: 'SCI' },
  is_active: true, places_occupees: 20, places_totales: 30, nb_matieres: 8
}

describe('TeacherClassCard (#H9)', () => {
  it('affiche le nom, le niveau et les stats', () => {
    const w = mount(TeacherClassCard, { props: { classe } })
    expect(w.find('.class-name').text()).toBe('6e A')
    expect(w.text()).toContain('Sixième')
    expect(w.text()).toContain('20/30')
    expect(w.text()).toContain('8')
  })

  it('affiche le badge actif quand is_active vrai', () => {
    const w = mount(TeacherClassCard, { props: { classe } })
    expect(w.find('.active-badge').exists()).toBe(true)
  })

  it('masque le badge actif quand is_active faux', () => {
    const w = mount(TeacherClassCard, { props: { classe: { ...classe, is_active: false } } })
    expect(w.find('.active-badge').exists()).toBe(false)
  })
})
