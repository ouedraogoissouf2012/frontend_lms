/**
 * Test de montage de CalendarViewSelector.vue (H8 — décomposition UniversalCalendar).
 * Composant pur (prop currentView + emit change-view). On vérifie :
 *  - montage + racine .view-selector
 *  - la vue active reçoit la classe .active
 *  - le clic émet `change-view` avec la vue ciblée
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CalendarViewSelector from '@/components/calendar/CalendarViewSelector.vue'

function mountSelector(props = {}) {
  return mount(CalendarViewSelector, {
    props: { currentView: 'dayGridMonth', ...props }
  })
}

describe('CalendarViewSelector.vue (H8) — montage', () => {
  it('monte sans erreur (racine .view-selector présente)', () => {
    const w = mountSelector()
    expect(w.find('.view-selector').exists()).toBe(true)
    expect(w.findAll('button')).toHaveLength(3)
  })

  it('applique .active au bouton de la vue courante', () => {
    const w = mountSelector({ currentView: 'timeGridWeek' })
    const buttons = w.findAll('button')
    // index 1 = Semaine
    expect(buttons[1].classes()).toContain('active')
    expect(buttons[0].classes()).not.toContain('active')
  })

  it('émet `change-view` avec la vue ciblée au clic', async () => {
    const w = mountSelector()
    await w.findAll('button')[2].trigger('click') // Jour
    expect(w.emitted('change-view')[0]).toEqual(['timeGridDay'])
  })
})
