/**
 * Test du composable useCalendarView (H8 — décomposition UniversalCalendar).
 * Logique de la vue FullCalendar : label du mois, options, navigation impérative
 * et synchronisation des événements. L'API FullCalendar est simulée via un faux
 * objet exposant getApi() (calque du contrat de <CalendarView>).
 */
import { ref, computed, nextTick } from 'vue'
import { describe, it, expect, vi } from 'vitest'
import { useCalendarView } from '@/composables/useCalendarView'

function makeApi() {
  return {
    changeView: vi.fn(),
    prev: vi.fn(),
    next: vi.fn(),
    today: vi.fn(),
    removeAllEvents: vi.fn(),
    addEvent: vi.fn()
  }
}

function setup(initialEvents = []) {
  const api = makeApi()
  const calendarRef = ref({ getApi: () => api })
  const filteredEvents = ref(initialEvents)
  const onEventClick = vi.fn()
  const vm = useCalendarView({
    calendarRef,
    filteredEvents: computed(() => filteredEvents.value),
    onEventClick
  })
  return { vm, api, calendarRef, filteredEvents, onEventClick }
}

describe('useCalendarView (H8)', () => {
  it('expose un label de mois en français', () => {
    const { vm } = setup()
    expect(typeof vm.currentMonthLabel.value).toBe('string')
    expect(vm.currentMonthLabel.value.length).toBeGreaterThan(0)
  })

  it('calendarOptions reflète les événements filtrés et la vue courante', () => {
    const { vm } = setup([{ id: 'seance-1' }])
    expect(vm.calendarOptions.value.initialView).toBe('dayGridMonth')
    expect(vm.calendarOptions.value.events).toHaveLength(1)
    expect(vm.calendarOptions.value.locale).toBeDefined()
  })

  it('changeView met à jour currentView et pilote l’API', () => {
    const { vm, api } = setup()
    vm.changeView('timeGridWeek')
    expect(vm.currentView.value).toBe('timeGridWeek')
    expect(api.changeView).toHaveBeenCalledWith('timeGridWeek')
  })

  it('previousMonth / nextMonth / goToToday pilotent l’API', () => {
    const { vm, api } = setup()
    vm.previousMonth(); vm.nextMonth(); vm.goToToday()
    expect(api.prev).toHaveBeenCalled()
    expect(api.next).toHaveBeenCalled()
    expect(api.today).toHaveBeenCalled()
  })

  it('eventClick relaie l’événement à onEventClick', () => {
    const { vm, onEventClick } = setup()
    const fakeEvent = { id: 'eval-1' }
    vm.calendarOptions.value.eventClick({ event: fakeEvent })
    expect(onEventClick).toHaveBeenCalledWith(fakeEvent)
  })

  it('synchronise FullCalendar quand les événements filtrés changent', async () => {
    const { api, filteredEvents } = setup([])
    api.removeAllEvents.mockClear()
    api.addEvent.mockClear()
    filteredEvents.value = [{ id: 'seance-1' }, { id: 'seance-2' }]
    await nextTick()
    expect(api.removeAllEvents).toHaveBeenCalled()
    expect(api.addEvent).toHaveBeenCalledTimes(2)
  })
})
