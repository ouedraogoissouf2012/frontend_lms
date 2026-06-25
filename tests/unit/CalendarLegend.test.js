/**
 * Test de montage de CalendarLegend.vue (H8 — décomposition UniversalCalendar).
 * Composant purement statique. On vérifie le montage + les 4 entrées de légende.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CalendarLegend from '@/components/calendar/CalendarLegend.vue'

describe('CalendarLegend.vue (H8) — montage', () => {
  it('monte sans erreur (racine .legend-card présente)', () => {
    const w = mount(CalendarLegend)
    expect(w.find('.legend-card').exists()).toBe(true)
  })

  it('affiche les 4 entrées de légende', () => {
    const w = mount(CalendarLegend)
    const items = w.findAll('.legend-item')
    expect(items).toHaveLength(4)
    expect(w.text()).toContain('Séances')
    expect(w.text()).toContain('Évaluations')
  })
})
