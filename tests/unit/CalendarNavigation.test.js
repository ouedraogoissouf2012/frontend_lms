/**
 * Test de montage de CalendarNavigation.vue (H8 — décomposition UniversalCalendar).
 * Sous-composant présentationnel (props + emits, aucun appel API). On vérifie :
 *  - montage + racine .navigation-card + label mois rendu
 *  - les boutons émettent previous/next/today/refresh
 *  - le sélecteur de vue enfant relaie change-view
 *  - l'état refreshing désactive le bouton d'actualisation
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CalendarNavigation from '@/components/calendar/CalendarNavigation.vue'

function mountNav(props = {}) {
  return mount(CalendarNavigation, {
    props: { currentMonthLabel: 'juin 2026', currentView: 'dayGridMonth', refreshing: false, ...props }
  })
}

describe('CalendarNavigation.vue (H8) — montage', () => {
  it('monte et affiche le label du mois courant', () => {
    const w = mountNav()
    expect(w.find('.navigation-card').exists()).toBe(true)
    expect(w.find('.current-month').text()).toContain('juin 2026')
  })

  it('émet previous / next au clic sur les boutons de navigation', async () => {
    const w = mountNav()
    const navButtons = w.findAll('.nav-button')
    await navButtons[0].trigger('click')
    await navButtons[1].trigger('click')
    expect(w.emitted('previous')).toBeTruthy()
    expect(w.emitted('next')).toBeTruthy()
  })

  it('émet today et refresh', async () => {
    const w = mountNav()
    await w.find('.today-button').trigger('click')
    await w.find('.refresh-button').trigger('click')
    expect(w.emitted('today')).toBeTruthy()
    expect(w.emitted('refresh')).toBeTruthy()
  })

  it('relaie change-view depuis le sélecteur de vue enfant', async () => {
    const w = mountNav()
    await w.findAll('.view-selector button')[1].trigger('click') // Semaine
    expect(w.emitted('change-view')[0]).toEqual(['timeGridWeek'])
  })

  it('désactive le bouton actualiser quand refreshing est vrai', () => {
    const w = mountNav({ refreshing: true })
    expect(w.find('.refresh-button').attributes('disabled')).toBeDefined()
  })
})
