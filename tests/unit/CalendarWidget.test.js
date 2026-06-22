/**
 * Test de montage de CalendarWidget.vue (G8 — Agent B).
 * <script setup> utilisant useRouter() et le composant FullCalendar (@fullcalendar/vue3).
 * On mocke vue-router (push) et on stub FullCalendar pour éviter l'init réelle du calendrier.
 * Assertions : montage sans erreur (.calendar-widget) + titre + bascule de vue (changeView).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

import CalendarWidget from '@/components/widgets/CalendarWidget.vue'

function mountWidget(props = {}) {
  return mount(CalendarWidget, {
    props: { events: [], height: '500px', ...props },
    global: {
      stubs: { FullCalendar: true }
    }
  })
}

describe('CalendarWidget.vue (G8) — montage', () => {
  it('monte sans erreur (racine .calendar-widget présente)', () => {
    const w = mountWidget()
    expect(w.find('.calendar-widget').exists()).toBe(true)
  })

  it('affiche le titre du widget', () => {
    const w = mountWidget()
    expect(w.find('.widget-title').text()).toContain('Calendrier des événements')
  })

  it('change la vue active au clic sur le bouton Semaine', async () => {
    const w = mountWidget()
    const buttons = w.findAll('.view-btn')
    // index 1 = "Semaine" (Mois, Semaine, Jour)
    await buttons[1].trigger('click')
    expect(buttons[1].classes()).toContain('active')
  })
})
