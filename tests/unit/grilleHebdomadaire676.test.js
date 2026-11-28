/**
 * #676 — la grille hebdomadaire d'un emploi du temps, par le VRAI client HTTP.
 *   - du lundi au samedi, le dimanche seulement s'il porte une ligne (ARRÊT 1, Q3) ;
 *   - un créneau se clique : cours (matière du PROGRAMME de la classe, enseignant « celui du programme » par défaut,
 *     type) ou pause nommée ; la grille part d'un bloc (`PUT …/lignes`) et l'écran annonce les séances retirées ;
 *   - « Générer les séances » montre le rapport : créées, ignorées avec leur motif, et les séances en conflit ;
 *   - copier vers une autre classe ou une autre plage.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const push = vi.fn()
vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/admin/emplois-du-temps/3', params: { id: '3' }, query: {} }), useRouter: () => ({ push }) }))

import AdminEmploiDuTemps from '@/views/admin/AdminEmploiDuTemps.vue'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { serveurFictif } from '../helpers/serveurFictif'

const ligne = (id, jour, debut, fin, extra = {}) => ({ id, jour, debut, fin, matiere_id: null, enseignant_id: null, type_seance: null, libelle: null, ...extra })
const MATHS = ligne(1, 1, '08:00', '10:00', { matiere_id: 4, enseignant_id: 7, type_seance: 'cm' })
const PAUSE = ligne(2, 1, '10:00', '10:15', { libelle: 'Récréation' })
const EMPLOI = { id: 3, classe_id: 9, titre: 'Semestre 1', du: '2026-12-07', au: '2027-01-31', en_vigueur: true, lignes: [MATHS, PAUSE] }
const FICHE = { success: true, data: { id: 9, nom: 'Terminale A', matieres_disponibles: [{ id: 4, nom: 'Maths' }, { id: 5, nom: 'Physique' }] } }
const ENSEIGNANTS = { success: true, data: [{ id: 7, nom: 'M. Koné' }, { id: 8, nom: 'Mme Traoré' }] }
const CLASSES = { success: true, data: [{ id: 9, libelle: 'Terminale A' }, { id: 11, libelle: 'Terminale B' }], meta: { current_page: 1, last_page: 1 } }

let serveur
function servir(emploi = EMPLOI) {
  serveur.servir({
    'get /lms/emplois-du-temps/3': [200, { success: true, data: emploi }],
    'get /lms/classes/local/9': [200, FICHE],
    'get /lms/enseignants': [200, ENSEIGNANTS],
    'get /classes': [200, CLASSES],
  })
}

async function monter() {
  const w = mount(AdminEmploiDuTemps, {
    attachTo: document.body,
    global: { stubs: { DashboardLayout: { template: '<div><slot /></div>' }, ContentLoader: true, RouterLink: RouterLinkStub } },
  })
  await flushPromises()
  return w
}
const champ = (w, nom) => w.find(`[data-champ="${nom}"]`)
const action = (w, nom) => w.find(`[data-action="${nom}"]`)
const jours = (w) => w.findAll('[data-jour]').map((c) => c.attributes('data-jour'))

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''
  push.mockReset()
  serveur = serveurFictif()
  servir()
})
afterEach(() => serveur.fermer())

describe('#676 — la semaine affichée', () => {
  it('du lundi au samedi ; chaque ligne à son jour, cours par sa matière et son enseignant, pause par son nom', async () => {
    const w = await monter()
    expect(jours(w)).toEqual(['1', '2', '3', '4', '5', '6'])
    const lundi = w.find('[data-jour="1"]')
    expect(lundi.findAll('[data-ligne]').map((l) => l.text().replace(/\s+/g, ' '))).toEqual([
      expect.stringMatching(/08:00.*10:00.*Maths.*M\. Koné/),
      expect.stringMatching(/10:00.*10:15.*Récréation/),
    ])
    w.unmount()
  })

  it('le dimanche paraît seulement s’il porte une ligne', async () => {
    servir({ ...EMPLOI, lignes: [...EMPLOI.lignes, ligne(9, 7, '09:00', '11:00', { matiere_id: 5 })] })
    const w = await monter()
    expect(jours(w)).toEqual(['1', '2', '3', '4', '5', '6', '7'])
    w.unmount()
  })
})

describe('#676 — composer la grille', () => {
  it('un clic sur « Ajouter » d’un jour ouvre un créneau ; « celui du programme » envoie null ; la grille part d’un bloc', async () => {
    serveur.servir({ 'put /lms/emplois-du-temps/3/lignes': [200, { success: true, data: { ...EMPLOI, retirees: 0 } }] })
    const w = await monter()
    await w.find('[data-ajouter="3"]').trigger('click')
    await champ(w, 'matiere').setValue('5')
    await champ(w, 'debut').setValue('14:00')
    await champ(w, 'fin').setValue('16:00')
    await champ(w, 'type').setValue('td')
    await action(w, 'valider-ligne').trigger('click')
    expect(w.find('[data-jour="3"]').text()).toContain('Physique')

    await action(w, 'enregistrer').trigger('click')
    await flushPromises()
    expect(serveur.ecritures().map((r) => r.corps)).toEqual([{ lignes: [
      { jour: 1, debut: '08:00', fin: '10:00', matiere_id: 4, enseignant_id: 7, type_seance: 'cm' },
      { jour: 1, debut: '10:00', fin: '10:15', libelle: 'Récréation' },
      { jour: 3, debut: '14:00', fin: '16:00', matiere_id: 5, enseignant_id: null, type_seance: 'td' },
    ] }])
    w.unmount()
  })

  it('un créneau se clique pour le modifier ou le retirer', async () => {
    serveur.servir({ 'put /lms/emplois-du-temps/3/lignes': [200, { success: true, data: { ...EMPLOI, lignes: [MATHS], retirees: 0 } }] })
    const w = await monter()
    await w.findAll('[data-jour="1"] [data-ligne]')[1].trigger('click')
    expect(champ(w, 'libelle').element.value).toBe('Récréation')
    await action(w, 'retirer-ligne').trigger('click')
    await action(w, 'enregistrer').trigger('click')
    await flushPromises()
    expect(serveur.ecritures()[0].corps.lignes).toHaveLength(1)
    w.unmount()
  })

  it('une pause exige un nom, un cours une matière ; la fin suit le début ; rien ne part', async () => {
    const w = await monter()
    await w.find('[data-ajouter="2"]').trigger('click')
    await champ(w, 'debut').setValue('10:00')
    await champ(w, 'fin').setValue('09:00')
    await action(w, 'valider-ligne').trigger('click')
    expect(w.text()).toContain(ERROR_MESSAGES.emploiDuTempsMatiereRequise)
    expect(w.text()).toContain(ERROR_MESSAGES.emploiDuTempsFinAvantDebut)
    expect(w.find('[data-jour="2"] [data-ligne]').exists()).toBe(false)
    w.unmount()
  })

  it('les séances futures retirées par le serveur sont annoncées', async () => {
    serveur.servir({ 'put /lms/emplois-du-temps/3/lignes': [200, { success: true, data: { ...EMPLOI, retirees: 2 } }] })
    const w = await monter()
    await action(w, 'enregistrer').trigger('click')
    await flushPromises()
    expect(w.find('[role="status"]').text()).toContain('2 séances futures')
    w.unmount()
  })

  it.each([
    ['grille_en_conflit', 'emploiDuTempsGrilleEnConflit'],
    ['matiere_hors_programme', 'emploiDuTempsMatiereHorsProgramme'],
  ])('un refus %s est dit par le catalogue, et la grille saisie reste', async (reason, cle) => {
    serveur.servir({ 'put /lms/emplois-du-temps/3/lignes': [422, { success: false, message: 'Texte du serveur', reason }] })
    const w = await monter()
    await action(w, 'enregistrer').trigger('click')
    await flushPromises()
    expect(w.find('[role="alert"]').text()).toBe(ERROR_MESSAGES[cle])
    expect(w.findAll('[data-jour="1"] [data-ligne]')).toHaveLength(2)
    w.unmount()
  })
})

describe('#676 — générer les séances', () => {
  it('le rapport : créées, ignorées par date et motif, et les séances en conflit', async () => {
    serveur.servir({ 'post /lms/emplois-du-temps/3/generer': [200, { success: true, data: {
      creees: 7,
      ignorees: [
        { date: '2026-12-14', ligne_id: 1, motif: 'conflit', conflits: [77] },
        { date: '2026-12-21', ligne_id: 1, motif: 'deja_generee', conflits: [] },
      ],
    } }] })
    const w = await monter()
    await action(w, 'generer').trigger('click')
    await flushPromises()
    const rapport = w.find('[data-rapport]')
    expect(rapport.text()).toContain('7 séances créées')
    const ignorees = rapport.findAll('[data-ignoree]')
    expect(ignorees[0].text()).toContain('14/12/2026')
    expect(ignorees[0].text()).toContain(ERROR_MESSAGES.emploiDuTempsIgnoreeConflit)
    expect(ignorees[1].text()).toContain(ERROR_MESSAGES.emploiDuTempsIgnoreeDejaGeneree)
    expect(rapport.findAllComponents(RouterLinkStub).map((l) => l.props('to'))).toEqual(['/seances/77'])
    w.unmount()
  })
})

describe('#676 — copier', () => {
  it('vers une autre classe et une autre plage, puis ouvre la copie', async () => {
    serveur.servir({ 'post /lms/emplois-du-temps/3/copier': [201, { success: true, data: { ...EMPLOI, id: 15, classe_id: 11 } }] })
    const w = await monter()
    await champ(w, 'copie-classe').setValue('11')
    await champ(w, 'copie-du').setValue('2027-02-01')
    await champ(w, 'copie-au').setValue('2027-06-30')
    await w.find('[data-copie]').trigger('submit')
    await flushPromises()
    expect(serveur.ecritures().map((r) => [r.cle, r.corps])).toEqual([
      ['post /lms/emplois-du-temps/3/copier', { classe_id: 11, du: '2027-02-01', au: '2027-06-30' }],
    ])
    expect(push).toHaveBeenCalledWith({ name: 'AdminEmploiDuTemps', params: { id: 15 } })
    w.unmount()
  })
})
