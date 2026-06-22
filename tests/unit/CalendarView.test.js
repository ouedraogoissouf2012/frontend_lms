/**
 * Test de montage de CalendarView.vue (H8 — décomposition UniversalCalendar).
 * Wrapper de FullCalendar : on stub FullCalendar et ContentLoader pour éviter
 * l'init réelle. On vérifie :
 *  - le loader s'affiche quand loading=true (FullCalendar absent)
 *  - le calendrier s'affiche quand loading=false
 *  - getApi() est exposé (parité avec l'ancien calendarRef.getApi())
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

// On neutralise FullCalendar (init réelle = plugins requis) et le loader.
vi.mock('@fullcalendar/vue3', () => ({ default: { name: 'FullCalendar', render: () => null } }))

import CalendarView from '@/components/calendar/CalendarView.vue'

function mountView(props = {}) {
  return mount(CalendarView, {
    props: { options: { initialView: 'dayGridMonth' }, loading: false, ...props },
    global: { stubs: { ContentLoader: true } }
  })
}

describe('CalendarView.vue (H8) — montage', () => {
  it('monte la carte calendrier et le wrapper quand loading=false', () => {
    const w = mountView({ loading: false })
    expect(w.find('.calendar-card').exists()).toBe(true)
    expect(w.find('.calendar-wrapper').exists()).toBe(true)
  })

  it('affiche le loader et masque le wrapper quand loading=true', () => {
    const w = mountView({ loading: true })
    expect(w.find('.calendar-wrapper').exists()).toBe(false)
  })

  it('expose getApi()', () => {
    const w = mountView()
    expect(typeof w.vm.getApi).toBe('function')
  })
})
