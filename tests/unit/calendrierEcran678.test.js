/**
 * #678 — l'écran « Calendrier de l'année », par le VRAI client HTTP.
 *   - la plage lue suit le mois affiché ; vue MOIS (FullCalendar) et vue LISTE ;
 *   - tout membre lit ; seule la gestion voit « Publier », « Modifier », « Supprimer » (ARRÊT 1, Q1) : le serveur fait
 *     foi, un 403 est dit par le catalogue ;
 *   - la portée « classes choisies » lit les classes de l'établissement, par leur id LOCAL (Q2).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/calendrier', params: {}, query: {} }), useRouter: () => ({ push: vi.fn() }) }))
// La carte FullCalendar est remplacée au niveau du MODULE : son SCSS n'est alors jamais compilé (sass-embedded est
// cassé sous Windows en local), et le test lit les options que l'écran lui passe.
const vueDuMois = vi.hoisted(() => ({ options: null }))
vi.mock('@/components/calendar/CalendarView.vue', () => ({
  default: {
    name: 'CalendarView',
    props: ['options', 'loading'],
    template: '<div data-mois />',
    setup(props, { expose }) {
      vueDuMois.options = () => props.options
      expose({ getApi: () => null })
    },
  },
}))

import { useAuthStore } from '@/stores/auth'
import { useConfirm } from '@/composables/useConfirm'
import CalendrierDeLAnnee from '@/views/shared/CalendrierDeLAnnee.vue'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { serveurFictif } from '../helpers/serveurFictif'

const VACANCES = { id: 4, type: 'vacances', titre: 'Vacances de Noël', debut: '2026-12-19', fin: '2027-01-04', portee: 'ecole', classe_ids: [] }
const BAC = { id: 5, type: 'examens', titre: 'Bac blanc', debut: '2026-12-14', fin: '2026-12-16', portee: 'classes', classe_ids: [9] }
const CLASSES = { success: true, data: [{ id: 9, libelle: 'Terminale A' }, { id: 11, libelle: 'Terminale B' }], meta: { current_page: 1, last_page: 1 } }

let serveur

function connecter(role) {
  useAuthStore().setSession({ user: { id: 1, role }, token: 't' }, {})
}
async function monter(role = 'coordinateur') {
  connecter(role)
  const w = mount(CalendrierDeLAnnee, {
    attachTo: document.body,
    global: { stubs: { DashboardLayout: { template: '<div><slot /></div>' }, ContentLoader: true } },
  })
  await flushPromises()
  return w
}
const champ = (w, nom) => w.find(`[data-champ="${nom}"]`)
const lectures = () => serveur.requetes.filter((r) => r.cle === 'get /lms/calendrier').map((r) => r.params)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-12-10T09:00:00'))
  setActivePinia(createPinia())
  sessionStorage.clear()
  document.body.innerHTML = ''
  serveur = serveurFictif()
  serveur.servir({
    'get /lms/calendrier': [200, { success: true, data: [BAC, VACANCES] }],
    'get /lms/classes/etablissement': [200, CLASSES],
  })
})
afterEach(() => {
  serveur.fermer()
  vi.useRealTimers()
})

describe('#678 — la lecture', () => {
  it('lit le mois affiché, puis le suivant', async () => {
    const w = await monter('etudiant')
    expect(lectures()[0]).toEqual({ du: '2026-12-01', au: '2026-12-31' })
    await w.find('[data-action="mois-suivant"]').trigger('click')
    await flushPromises()
    expect(lectures().at(-1)).toEqual({ du: '2027-01-01', au: '2027-01-31' })
    w.unmount()
  })

  it('vue mois : les événements vont à FullCalendar, en journées entières (fin exclusive)', async () => {
    const w = await monter('etudiant')
    const evenements = vueDuMois.options().events
    expect(evenements.map((e) => [e.title, e.start, e.end, e.allDay])).toEqual([
      ['Bac blanc', '2026-12-14', '2026-12-17', true],
      ['Vacances de Noël', '2026-12-19', '2027-01-05', true],
    ])
    w.unmount()
  })

  it('vue liste : dates, type, titre, portée', async () => {
    const w = await monter('coordinateur')
    await w.find('[data-vue="liste"]').trigger('click')
    const lignes = w.findAll('[data-evenement]').map((l) => l.text().replace(/\s+/g, ' '))
    expect(lignes[0]).toMatch(/14\/12\/2026.*16\/12\/2026.*Examens.*Bac blanc.*Terminale A/)
    expect(lignes[1]).toMatch(/19\/12\/2026.*04\/01\/2027.*Vacances.*Vacances de Noël.*Toute l’école/)
    w.unmount()
  })

  it('un élève lit, mais ne voit aucune écriture', async () => {
    const w = await monter('etudiant')
    await w.find('[data-vue="liste"]').trigger('click')
    expect(w.findAll('[data-evenement]')).toHaveLength(2)
    expect(w.find('[data-action="publier"]').exists()).toBe(false)
    expect(w.find('[data-action="modifier"]').exists()).toBe(false)
    expect(serveur.requetes.some((r) => r.cle === 'get /lms/classes/etablissement')).toBe(false)
    w.unmount()
  })

  it('une lecture en panne est dite, sans faux calendrier vide', async () => {
    serveur.servir({ 'get /lms/calendrier': [500, { success: false, message: 'Erreur' }] })
    const w = await monter('etudiant')
    expect(w.find('[role="alert"]').exists()).toBe(true)
    expect(w.text()).not.toContain(ERROR_MESSAGES.calendrierAucunEvenement)
    w.unmount()
  })
})

describe('#678 — la gestion écrit', () => {
  async function publier(w, valeurs, classes = []) {
    await w.find('[data-action="publier"]').trigger('click')
    for (const [nom, valeur] of Object.entries(valeurs)) await champ(w, nom).setValue(valeur)
    if (classes.length) {
      await champ(w, 'portee-classes').setValue(true)
      for (const id of classes) await w.find(`[data-classe="${id}"]`).setValue(true)
    }
    await w.find('[data-evenement-form]').trigger('submit')
    await flushPromises()
  }

  it('publie pour des classes choisies (ids locaux), puis relit le mois', async () => {
    serveur.servir({ 'post /lms/calendrier': [201, { success: true, data: { ...BAC, id: 12 } }] })
    const w = await monter()
    const avant = lectures().length
    await publier(w, { type: 'examens', titre: 'Bac blanc', debut: '2026-12-14', fin: '2026-12-16' }, [9])
    expect(serveur.ecritures().map((r) => r.corps)).toEqual([{ type: 'examens', titre: 'Bac blanc', debut: '2026-12-14', fin: '2026-12-16', classe_ids: [9] }])
    expect(lectures().length).toBe(avant + 1)
    expect(w.find('[role="status"]').text()).toContain('publié')
    w.unmount()
  })

  it('sans titre, ou la fin avant le début : refusé avant l’envoi', async () => {
    const w = await monter()
    await publier(w, { type: 'autre', titre: ' ', debut: '2026-12-16', fin: '2026-12-14' })
    expect(serveur.ecritures()).toEqual([])
    expect(w.text()).toContain(ERROR_MESSAGES.calendrierTitreRequis)
    expect(w.text()).toContain(ERROR_MESSAGES.calendrierFinAvantDebut)
    w.unmount()
  })

  it.each([
    [422, { success: false, message: 'Texte du serveur', reason: 'classe_hors_ecole' }, 'calendrierClasseHorsEcole'],
    [403, { success: false, message: 'Texte du serveur' }, null],
  ])('un refus %i est dit par le catalogue, jamais par le texte du serveur', async (statut, corps, cle) => {
    serveur.servir({ 'post /lms/calendrier': [statut, corps] })
    const w = await monter()
    await publier(w, { type: 'autre', titre: 'X', debut: '2026-12-14', fin: '2026-12-14' })
    const alerte = w.find('[role="alert"]').text()
    expect(alerte).not.toContain('Texte du serveur')
    if (cle) expect(alerte).toBe(ERROR_MESSAGES[cle])
    else expect(alerte.length).toBeGreaterThan(0)
    w.unmount()
  })

  it('modifie un événement depuis la liste : la saisie est préremplie, l’envoi est un PUT', async () => {
    serveur.servir({ 'put /lms/calendrier/4': [200, { success: true, data: { ...VACANCES, titre: 'Vacances' } }] })
    const w = await monter()
    await w.find('[data-vue="liste"]').trigger('click')
    await w.findAll('[data-action="modifier"]')[1].trigger('click')
    expect(champ(w, 'titre').element.value).toBe('Vacances de Noël')
    await champ(w, 'titre').setValue('Vacances')
    await w.find('[data-evenement-form]').trigger('submit')
    await flushPromises()
    expect(serveur.ecritures().map((r) => [r.cle, r.corps])).toEqual([
      ['put /lms/calendrier/4', { type: 'vacances', titre: 'Vacances', debut: '2026-12-19', fin: '2027-01-04', classe_ids: [] }],
    ])
    w.unmount()
  })

  it('supprime après confirmation', async () => {
    serveur.servir({ 'delete /lms/calendrier/5': [200, { success: true, message: 'Événement supprimé' }] })
    const w = await monter()
    await w.find('[data-vue="liste"]').trigger('click')
    await w.findAll('[data-action="supprimer"]')[0].trigger('click')
    useConfirm().accept()
    await flushPromises()
    expect(serveur.ecritures().map((r) => r.cle)).toEqual(['delete /lms/calendrier/5'])
    w.unmount()
  })
})
