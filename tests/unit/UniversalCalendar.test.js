/**
 * Test de montage (smoke) de UniversalCalendar.vue (#28bis / G8 / H8).
 * Depuis H8, l'orchestrateur compose CalendarNavigation, CalendarFilters,
 * CalendarView (qui rend FullCalendar), CalendarLegend et EventDetailModal, et
 * délègue l'état de la vue à useCalendarView.
 * On mocke :
 *  - vue-router (useRouter)
 *  - @/composables/useCalendarEvents → refs neutres + loadEvents/refreshData no-op (zéro réseau)
 * et on stub les sous-composants présentationnels.
 * Assertion : montage sans erreur (racine .calendar-container présente) + loadEvents au montage.
 */
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, it, expect, vi } from 'vitest'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

const loadEvents = vi.fn()
const refreshData = vi.fn(() => Promise.resolve())

vi.mock('@/composables/useCalendarEvents', () => ({
  useCalendarEvents: () => ({
    events: ref([]),
    matieres: ref([]),
    classes: ref([]),
    enseignants: ref([]),
    loading: ref(false),
    refreshing: ref(false),
    loadEvents,
    refreshData
  })
}))

import UniversalCalendar from '@/components/calendar/UniversalCalendar.vue'

function mountCalendar(props = {}) {
  return mount(UniversalCalendar, {
    props: { userRole: 'teacher', userId: 1, ...props },
    global: {
      stubs: {
        CalendarNavigation: true,
        CalendarFilters: true,
        CalendarView: true,
        CalendarCompactAgenda: true,
        CalendarLegend: true,
        EventDetailModal: true
      }
    }
  })
}

describe('UniversalCalendar.vue (#28bis) — montage smoke', () => {
  it('monte sans erreur (racine .calendar-container présente)', () => {
    const w = mountCalendar()
    expect(w.find('.calendar-container').exists()).toBe(true)
  })

  it('déclenche loadEvents au montage', () => {
    mountCalendar()
    expect(loadEvents).toHaveBeenCalled()
  })

  it('monte aussi la surface agenda compacte', () => {
    const w = mountCalendar()
    expect(w.findComponent({ name: 'CalendarCompactAgenda' }).exists()).toBe(true)
  })
})
