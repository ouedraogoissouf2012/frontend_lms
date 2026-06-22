/**
 * Test du composable useCalendarWidget (H8 ≤300) : config FullCalendar, bascule de
 * vue, sélection d'événement (+ emit) et navigation. Router mocké ; pas de
 * FullCalendar réel (calendarRef nul → getApi() null-safe).
 */
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi } from 'vitest'

const push = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))

import { useCalendarWidget } from '@/composables/useCalendarWidget'

function setup(props = {}) {
  let api
  const emitted = []
  const Comp = defineComponent({
    emits: ['event-click', 'date-click'],
    setup(_, { emit }) {
      api = useCalendarWidget(
        { events: [{ id: 1 }], height: '500px', ...props },
        (e, p) => { emitted.push([e, p]); emit(e, p) }
      )
      return () => null
    }
  })
  mount(Comp)
  return { api, emitted }
}

describe('useCalendarWidget (H8)', () => {
  it('expose une config FullCalendar avec les événements de la prop', () => {
    const { api } = setup()
    expect(api.calendarOptions.value.events).toEqual([{ id: 1 }])
    expect(api.calendarOptions.value.height).toBe('500px')
    expect(api.currentView.value).toBe('dayGridMonth')
  })

  it('change la vue courante', () => {
    const { api } = setup()
    api.changeView('timeGridWeek')
    expect(api.currentView.value).toBe('timeGridWeek')
  })

  it('sélectionne un événement au clic et émet event-click', () => {
    const { api, emitted } = setup()
    const ev = { id: 9, title: 'X' }
    api.handleEventClick({ event: ev })
    expect(api.selectedEvent.value).toEqual(ev)
    expect(emitted).toContainEqual(['event-click', ev])
  })

  it('ferme la modale (selectedEvent = null)', () => {
    const { api } = setup()
    api.handleEventClick({ event: { id: 1 } })
    api.closeEventModal()
    expect(api.selectedEvent.value).toBe(null)
  })

  it('navigue via goToEvent si une url est présente, puis ferme', () => {
    const { api } = setup()
    api.handleEventClick({ event: { id: 1, extendedProps: { url: '/seances/1' } } })
    api.goToEvent()
    expect(push).toHaveBeenCalledWith('/seances/1')
    expect(api.selectedEvent.value).toBe(null)
  })
})
