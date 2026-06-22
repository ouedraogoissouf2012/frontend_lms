/**
 * Test de montage (smoke) de UniversalCalendar.vue (#28bis / G8 — Agent B).
 * Le composant utilise useRouter(), le composable useCalendarEvents (appels réseau),
 * FullCalendar et les sous-composants CalendarFilters / EventDetailModal.
 * On mocke :
 *  - vue-router (useRouter)
 *  - @/composables/useCalendarEvents → refs neutres + loadEvents/refreshData no-op (zéro réseau)
 * et on stub FullCalendar, CalendarFilters, EventDetailModal, ContentLoader.
 * Assertion : montage sans erreur (racine .calendar-container présente).
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
        FullCalendar: true,
        CalendarFilters: true,
        EventDetailModal: true,
        ContentLoader: true
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
})
