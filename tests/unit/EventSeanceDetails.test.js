/**
 * Test de EventSeanceDetails (H8 ≤300) : rendu des champs séance + section visio.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EventSeanceDetails from '@/components/calendar/EventSeanceDetails.vue'

describe('EventSeanceDetails (H8)', () => {
  it('affiche matière, classe et les valeurs formatées', () => {
    const w = mount(EventSeanceDetails, {
      props: {
        eventData: { matiere_nom: 'Maths', classe_nom: '6e A' },
        formattedDate: 'lundi 20 octobre 2025',
        formattedTimeRange: '09:00 - 10:00',
        visioStatusText: 'En direct'
      }
    })
    const values = w.findAll('.detail-value').map(n => n.text())
    expect(values).toContain('Maths')
    expect(values).toContain('6e A')
    expect(values).toContain('lundi 20 octobre 2025')
    expect(values).toContain('09:00 - 10:00')
  })

  it('affiche la section visio si activée', () => {
    const w = mount(EventSeanceDetails, {
      props: {
        eventData: { visio: { enabled: true, status: 'active' } },
        visioStatusText: 'En direct'
      }
    })
    expect(w.find('.visio-section').exists()).toBe(true)
    expect(w.find('.visio-status').text()).toBe('En direct')
  })

  it('masque la section visio si non activée', () => {
    const w = mount(EventSeanceDetails, { props: { eventData: {} } })
    expect(w.find('.visio-section').exists()).toBe(false)
  })
})
