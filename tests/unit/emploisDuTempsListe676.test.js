/**
 * #676 — l'écran « Emplois du temps » (liste), par le VRAI client HTTP : les alertes du serveur, UN tableau lisible sur
 * téléphone (décision de la superviseure, 28/11 : une seule vue), le filtre par classe et la création. Un refus 422 du
 * serveur est dit par le catalogue des motifs.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const push = vi.fn()
vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/admin/emplois-du-temps', params: {}, query: {} }), useRouter: () => ({ push }) }))

import AdminEmploisDuTemps from '@/views/admin/AdminEmploisDuTemps.vue'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { serveurFictif } from '../helpers/serveurFictif'

const CLASSES = { success: true, data: [{ id: 9, libelle: 'Terminale A' }, { id: 11, libelle: 'Terminale B' }], meta: { current_page: 1, last_page: 1 } }
const EMPLOIS = [
  { id: 3, classe_id: 9, titre: 'Semestre 1', du: '2026-12-07', au: '2027-01-31', en_vigueur: true, lignes: [{ id: 1 }, { id: 2 }] },
  { id: 4, classe_id: 11, titre: 'Ancien', du: '2026-09-01', au: '2026-11-30', en_vigueur: false, lignes: [] },
]
const ALERTES = { sans_emploi_du_temps: [{ classe_id: 11, libelle: 'Terminale B' }], expires: [{ id: 4, classe_id: 11, titre: 'Ancien', au: '2026-11-30' }] }

let serveur
function servirLeDefaut() {
  serveur.servir({
    'get /classes': [200, CLASSES],
    'get /lms/emplois-du-temps': [200, { success: true, data: EMPLOIS }],
    'get /lms/emplois-du-temps/alertes': [200, { success: true, data: ALERTES }],
  })
}

async function monter() {
  const w = mount(AdminEmploisDuTemps, {
    attachTo: document.body,
    global: { stubs: { DashboardLayout: { template: '<div><slot /></div>' }, ContentLoader: true, RouterLink: RouterLinkStub } },
  })
  await flushPromises()
  return w
}
const champ = (w, nom) => w.find(`[data-champ="${nom}"]`)

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''
  push.mockReset()
  serveur = serveurFictif()
  servirLeDefaut()
})
afterEach(() => serveur.fermer())

describe('#676 — la liste', () => {
  it('les alertes du serveur : classes sans emploi du temps, emplois du temps expirés', async () => {
    const w = await monter()
    expect(w.findAll('[data-alerte="sans"]').map((li) => li.text())).toEqual(['Terminale B'])
    expect(w.findAll('[data-alerte="expire"]')[0].text()).toContain('Ancien')
    w.unmount()
  })

  it('UN tableau : la classe par son libellé, le titre, la plage, l’état, le nombre de créneaux, et le lien vers la grille', async () => {
    const w = await monter()
    const lignes = w.findAll('[data-emplois] tbody tr')
    expect(lignes).toHaveLength(2)
    expect(lignes[0].text()).toContain('Terminale A')
    expect(lignes[0].text()).toContain('Semestre 1')
    expect(lignes[0].text()).toContain('07/12/2026')
    expect(lignes[0].text()).toContain('En vigueur')
    expect(lignes[0].text()).toContain('2')
    expect(lignes[1].text()).toContain('Suspendu')
    expect(w.findAllComponents(RouterLinkStub).some((l) => JSON.stringify(l.props('to')).includes('"id":3'))).toBe(true)
    w.unmount()
  })

  it('le filtre par classe relit la liste du serveur avec classe_id', async () => {
    const w = await monter()
    await champ(w, 'filtre-classe').setValue('11')
    await flushPromises()
    const lectures = serveur.requetes.filter((r) => r.cle === 'get /lms/emplois-du-temps')
    expect(lectures.at(-1).params).toEqual({ classe_id: 11 })
    w.unmount()
  })

  it('aucun emploi du temps : l’écran le dit', async () => {
    serveur.servir({ 'get /lms/emplois-du-temps': [200, { success: true, data: [] }] })
    const w = await monter()
    expect(w.find('[data-emplois]').exists()).toBe(false)
    expect(w.text()).toContain(ERROR_MESSAGES.emploisDuTempsAucun)
    w.unmount()
  })
})

describe('#676 — créer un emploi du temps', () => {
  async function creer(w, valeurs) {
    for (const [nom, valeur] of Object.entries(valeurs)) await champ(w, nom).setValue(valeur)
    await w.find('[data-creation]').trigger('submit')
    await flushPromises()
  }

  it('crée, puis ouvre sa grille', async () => {
    serveur.servir({ 'post /lms/emplois-du-temps': [201, { success: true, data: { ...EMPLOIS[0], id: 12 } }] })
    const w = await monter()
    await creer(w, { classe: '9', titre: 'Semestre 2', du: '2027-02-01', au: '2027-06-30' })
    expect(serveur.ecritures().map((r) => r.corps)).toEqual([{ classe_id: 9, titre: 'Semestre 2', du: '2027-02-01', au: '2027-06-30' }])
    expect(push).toHaveBeenCalledWith({ name: 'AdminEmploiDuTemps', params: { id: 12 } })
    w.unmount()
  })

  it('sans classe ni titre, rien ne part et chaque champ le dit', async () => {
    const w = await monter()
    await creer(w, { du: '2027-02-01', au: '2027-06-30' })
    expect(serveur.ecritures()).toEqual([])
    expect(w.text()).toContain(ERROR_MESSAGES.emploiDuTempsClasseRequise)
    expect(w.text()).toContain(ERROR_MESSAGES.emploiDuTempsTitreRequis)
    w.unmount()
  })

  it('« au » avant « du » : refusé avant l’envoi', async () => {
    const w = await monter()
    await creer(w, { classe: '9', titre: 'S', du: '2027-02-01', au: '2027-01-01' })
    expect(serveur.ecritures()).toEqual([])
    expect(w.text()).toContain(ERROR_MESSAGES.emploiDuTempsPlageInversee)
    w.unmount()
  })

  it('hors de la période de la classe : le motif du serveur est dit par le catalogue', async () => {
    serveur.servir({ 'post /lms/emplois-du-temps': [422, { success: false, message: 'Texte du serveur', reason: 'emploi_du_temps_hors_periode' }] })
    const w = await monter()
    await creer(w, { classe: '9', titre: 'S', du: '2027-08-01', au: '2027-08-30' })
    expect(w.find('[role="alert"]').text()).toBe(ERROR_MESSAGES.emploiDuTempsHorsPeriode)
    expect(push).not.toHaveBeenCalled()
    w.unmount()
  })
})
