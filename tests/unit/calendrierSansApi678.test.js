/**
 * #678 — relevé par la CI de front#740 (4ef22a0b) : les jours fermés font changer les événements de l'agenda APRÈS
 * le montage, et la synchronisation de `useCalendarView` appelle alors `getApi()` sur la carte.
 *
 * Mesure (demandée par la superviseure, cas a ou b) : la vraie carte (`CalendarView.vue`) expose TOUJOURS `getApi`
 * (`defineExpose`). Les seuls moments où elle n'a pas d'API sont déjà tenus par le code, sans optionnalité ajoutée :
 *   - avant le montage, ou après le démontage pendant la lecture : la référence vaut `null`, `calendarRef.value?.`
 *     rend `undefined` et `if (calendarApi)` laisse la synchronisation de côté ;
 *   - carte montée mais EN CHARGEMENT (`ContentLoader`, FullCalendar absent) : `getApi()` rend `undefined`, même garde.
 * Le défaut venait des DOUBLURES de test (`CalendarView: true`, sans `getApi`), désormais complétées. Ces tests
 * verrouillent les trois cas réels.
 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { useCalendarView } from '@/composables/useCalendarView'

const VACANCES = { id: 'x', title: 'Vacances', start: '2026-12-19', end: '2027-01-05', allDay: true, display: 'background' }

function utiliser(carte) {
  const evenements = ref([])
  let vue
  mount({ template: '<div />', setup() { vue = useCalendarView({ calendarRef: carte, filteredEvents: evenements, onEventClick: () => {} }); return {} } })
  return { evenements, vue }
}

describe('#678 — la synchronisation de l’agenda, quand la carte n’a pas d’API', () => {
  it('pas encore montée (référence nulle) : les jours fermés arrivent sans erreur', async () => {
    const { evenements } = utiliser(ref(null))
    evenements.value = [VACANCES]
    await expect(nextTick()).resolves.toBeUndefined()
  })

  it('montée mais en chargement (getApi rend undefined) : sans erreur', async () => {
    const { evenements, vue } = utiliser(ref({ getApi: () => undefined }))
    evenements.value = [VACANCES]
    await nextTick()
    expect(() => vue.nextMonth()).not.toThrow()
  })

  it('démontée pendant la lecture (référence remise à nul) : sans erreur', async () => {
    const appels = []
    const carte = ref({ getApi: () => ({ removeAllEvents: () => appels.push('vider'), addEvent: (e) => appels.push(e.title) }) })
    const { evenements } = utiliser(carte)
    carte.value = null
    evenements.value = [VACANCES]
    await nextTick()
    expect(appels).toEqual(['vider'])
  })

  it('montée et prête : les jours fermés sont remis à FullCalendar', async () => {
    const appels = []
    const carte = ref({ getApi: () => ({ removeAllEvents: () => appels.push('vider'), addEvent: (e) => appels.push(e.title) }) })
    const { evenements } = utiliser(carte)
    evenements.value = [VACANCES]
    await nextTick()
    expect(appels.slice(-2)).toEqual(['vider', 'Vacances'])
  })
})
