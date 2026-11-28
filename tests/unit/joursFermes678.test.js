/**
 * #678 — les jours fermés en FOND des emplois du temps de l'élève et de l'enseignant (ARRÊT 1, Q3) : SEULEMENT les
 * vacances et la fermeture, avec la teinte « jour fermé » ; les autres types restent sur l'écran Calendrier. Leur
 * lecture suit le mois affiché ; une lecture en panne est dite et ne casse pas l'agenda.
 * Par le VRAI client HTTP.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { useJoursFermes } from '@/composables/useJoursFermes'
import { serveurFictif } from '../helpers/serveurFictif'

const evenement = (id, type, debut, fin) => ({ id, type, titre: `${type} ${id}`, debut, fin, portee: 'ecole', classe_ids: [] })

let serveur
function utiliser(mois) {
  let rendu
  mount({ template: '<div />', setup() { rendu = useJoursFermes(mois); return {} } })
  return rendu
}

beforeEach(() => {
  serveur = serveurFictif()
})
afterEach(() => serveur.fermer())

describe('#678 — les jours fermés', () => {
  it('seulement vacances et fermeture, en fond, fin exclusive, teinte « jour fermé »', async () => {
    serveur.servir({ 'get /lms/calendrier': [200, { success: true, data: [
      evenement(1, 'vacances', '2026-12-19', '2027-01-04'),
      evenement(2, 'examens', '2026-12-14', '2026-12-16'),
      evenement(3, 'fermeture', '2026-12-25', '2026-12-25'),
    ] }] })
    const { joursFermes } = utiliser(ref(new Date('2026-12-15T12:00:00')))
    await flushPromises()
    expect(joursFermes.value.map((e) => [e.title, e.start, e.end, e.display, e.allDay, e.classNames])).toEqual([
      ['vacances 1', '2026-12-19', '2027-01-05', 'background', true, ['jour-ferme']],
      ['fermeture 3', '2026-12-25', '2026-12-26', 'background', true, ['jour-ferme']],
    ])
  })

  it('la plage lue couvre la grille du mois affiché (les jours voisins compris), et suit le mois', async () => {
    serveur.servir({ 'get /lms/calendrier': [200, { success: true, data: [] }] })
    const mois = ref(new Date('2026-12-15T12:00:00'))
    utiliser(mois)
    await flushPromises()
    mois.value = new Date('2027-01-15T12:00:00')
    await flushPromises()
    expect(serveur.requetes.map((r) => r.params)).toEqual([
      { du: '2026-11-24', au: '2027-01-07' },
      { du: '2026-12-25', au: '2027-02-07' },
    ])
  })

  it('une lecture en panne est dite, sans jour fermé inventé', async () => {
    serveur.servir({ 'get /lms/calendrier': [503, { success: false, message: 'Indisponible' }] })
    const { joursFermes, erreurJoursFermes } = utiliser(ref(new Date('2026-12-15T12:00:00')))
    await flushPromises()
    expect(joursFermes.value).toEqual([])
    expect(erreurJoursFermes.value.length).toBeGreaterThan(0)
  })
})

describe('#678 — l’agenda de l’élève et de l’enseignant reçoit les jours fermés', () => {
  it('UniversalCalendar ajoute les jours fermés aux événements de FullCalendar', async () => {
    serveur.servir({
      'get /lms/calendrier': [200, { success: true, data: [evenement(1, 'vacances', '2026-12-19', '2027-01-04')] }],
    })
    let options
    const CalendarView = { props: ['options', 'loading'], template: '<div />', setup(props, { expose }) { options = () => props.options; expose({ getApi: () => null }) } }
    const { default: UniversalCalendar } = await import('@/components/calendar/UniversalCalendar.vue')
    const w = mount(UniversalCalendar, {
      props: { userRole: 'student', connecte: false },
      global: { stubs: { CalendarNavigation: true, CalendarFilters: true, CalendarView, CalendarCompactAgenda: true, CalendarLegend: true, EventDetailModal: true } },
    })
    await flushPromises()
    expect(options().events.some((e) => e.display === 'background' && e.title === 'vacances 1')).toBe(true)
    w.unmount()
  })
})
