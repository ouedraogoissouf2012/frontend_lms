/** Test de rendu LessonStatsGrid (#H4 ≤300) : débutés / terminés / moyenne. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import LessonStatsGrid from '@/components/lessons/LessonStatsGrid.vue'

describe('LessonStatsGrid (#H4)', () => {
  it('affiche les trois statistiques', () => {
    const w = mount(LessonStatsGrid, {
      props: { statistics: { students_started: 12, students_completed: 7, average_completion_rate: 58 } }
    })
    const values = w.findAll('.stat-value').map(n => n.text())
    expect(values).toEqual(['12', '7', '58%'])
    expect(w.findAll('.stat-item')).toHaveLength(3)
  })
})
