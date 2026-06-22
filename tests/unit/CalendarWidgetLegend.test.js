/** Test de CalendarWidgetLegend (H8 ≤300) : 3 pastilles de légende. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CalendarWidgetLegend from '@/components/widgets/CalendarWidgetLegend.vue'

describe('CalendarWidgetLegend (H8)', () => {
  it('affiche les 3 types (séances, évaluations, visioconférences)', () => {
    const w = mount(CalendarWidgetLegend)
    expect(w.findAll('.legend-item')).toHaveLength(3)
    expect(w.findAll('.legend-dot.seance')).toHaveLength(1)
    expect(w.findAll('.legend-dot.evaluation')).toHaveLength(1)
    expect(w.findAll('.legend-dot.visio')).toHaveLength(1)
  })
})
