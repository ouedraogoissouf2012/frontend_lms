/**
 * #678 — relevé par la CI de front#740 (4ef22a0b) : les jours fermés font changer les événements de l'agenda APRÈS
 * le montage. `useCalendarView` synchronisait alors FullCalendar par `calendarRef.value?.getApi()`, qui LÈVE quand la
 * carte n'expose pas `getApi` (une carte pas encore prête, ou un substitut de test) : « getApi is not a function »,
 * quatre erreurs non rattrapées, et le job rouge. Une carte sans API se laisse simplement de côté.
 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { useCalendarView } from '@/composables/useCalendarView'

function utiliser(carte) {
  const evenements = ref([])
  let vue
  mount({ template: '<div />', setup() { vue = useCalendarView({ calendarRef: ref(carte), filteredEvents: evenements, onEventClick: () => {} }); return {} } })
  return { evenements, vue }
}

describe('#678 — une carte sans getApi ne casse pas l’agenda', () => {
  it('les événements changent : aucune erreur', async () => {
    const { evenements } = utiliser({})
    evenements.value = [{ id: 'x', title: 'Vacances', start: '2026-12-19', end: '2027-01-05', allDay: true, display: 'background' }]
    await expect(nextTick()).resolves.toBeUndefined()
  })

  it.each(['previousMonth', 'nextMonth', 'goToToday'])('%s : aucune erreur', (action) => {
    const { vue } = utiliser({})
    expect(() => vue[action]()).not.toThrow()
  })

  it('changeView : la vue change, sans erreur', () => {
    const { vue } = utiliser({})
    expect(() => vue.changeView('timeGridWeek')).not.toThrow()
    expect(vue.currentView.value).toBe('timeGridWeek')
  })
})
