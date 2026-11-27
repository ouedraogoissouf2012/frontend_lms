/**
 * #683 (lms_backend#1676) : le classement d'une classe à l'écran, onglet « Résultats » de sa fiche.
 *
 * Contrat : `GET /lms/classes/{id}/resultats?du=&au=`, `id` de l'espace SOURCE. Personnel : la classe
 * entière (`statistiques`, `couverture`). Élève : sa seule ligne, `rang` seulement si l'école l'autorise.
 * Refus nommés : `class_not_taught`, `not_in_class`, `class_out_of_scope` ; panne : « Réessayer ».
 *
 * Ici le VRAI client HTTP (api.js et ses intercepteurs) : seul l'adaptateur réseau est remplacé.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { endpoints } from '@/services/endpoints'
import { useAuthStore } from '@/stores/auth'
import { lireBilanDeClasse } from '@/services/bilanDeClasse'
import { csvBilanDeClasse } from '@/utils/csvBilanDeClasse'
import ClasseResultatsTab from '@/components/classes/ClasseResultatsTab.vue'

const PIEGE = 'Texte serveur, jamais affiché'
let adaptateurOrigine
let requetes

function repondre(status, data) {
  api.defaults.adapter = async (config) => {
    requetes.push({ url: config.url, params: config.params ?? {} })
    const response = { status, statusText: '', data: JSON.stringify(data), headers: { 'content-type': 'application/json' }, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}

const MATIERES = [{ matiere_id: 11, libelle: 'Maths', coefficient: 1 }, { matiere_id: 12, libelle: 'Physique', coefficient: 3 }]
const ligne = (nom, moyenne, rang, maths, physique, manquantes = []) => ({
  compte_id: nom.length, nom, moyenne_generale: moyenne, rang,
  matieres: [{ matiere_id: 11, moyenne: maths }, { matiere_id: 12, moyenne: physique }],
  notes: [], notes_manquantes: manquantes,
})
const bilanPersonnel = () => ({
  classe: { id: 5, libelle: '6e A' }, periode: { du: null, au: null }, source: 'lms', seuil_reussite: 14.4,
  evaluations: [{ id: 91, titre: 'Maths 2', matiere_id: 11, date_evaluation: null, coefficient: 1 }],
  matieres: MATIERES,
  eleves: [ligne('Binta', 14.25, 3, 18, 13, [91]), ligne('Dédé', null, null, null, null, [91]), ligne('Awa', 14.5, 1, 10, 16, [91]), ligne('Coffi', 14.5, 1, 14.5, 14.5, [91])],
  statistiques: { effectif: 4, classes: 3, moyenne_classe: 14.42, taux_reussite: 66.67 },
  couverture: { matieres_sans_evaluation: [{ matiere_id: 13, libelle: 'Chimie' }], evaluations_sans_note: [91] },
})
const bilanEleve = (avecRang) => {
  const { statistiques: _s, couverture: _c, ...reste } = bilanPersonnel()
  const sienne = ligne('Binta', 14.25, 3, 18, 13)
  if (!avecRang) delete sienne.rang
  return { ...reste, eleves: [sienne] }
}

const RouterLink = { props: ['to'], template: '<a class="lien" :data-to="JSON.stringify(to)"><slot /></a>' }
async function onglet() {
  const w = mount(ClasseResultatsTab, { props: { classeId: 900077 }, global: { stubs: { RouterLink } } })
  await flushPromises()
  return w
}
const texteDes = (w, selecteur) => w.findAll(selecteur).map((n) => n.text())

beforeEach(() => {
  setActivePinia(createPinia())
  useAuthStore().setSession({ user: { id: 1, role: 'coordinateur' }, token: 't' }, {})
  adaptateurOrigine = api.defaults.adapter
  requetes = []
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('#683 — le chemin et le service', () => {
  it('resultats(id) → /lms/classes/{id}/resultats', () => {
    expect(endpoints.lms.classes.resultats(900077)).toBe('/lms/classes/900077/resultats')
  })

  it('n envoie que les bornes renseignées, et refuse une réponse sans élèves', async () => {
    repondre(200, { success: true, data: bilanPersonnel() })
    await lireBilanDeClasse(5, { du: '2026-09-01', au: '' })
    expect(requetes[0].params).toEqual({ du: '2026-09-01' })

    repondre(200, { success: true, data: { message: PIEGE } })
    await expect(lireBilanDeClasse(5)).rejects.toThrow()
  })
})

describe('#683 — la vue du personnel', () => {
  it('classe par rang, ex aequo côte à côte, l élève non classé en dernier, « — » jamais 0', async () => {
    repondre(200, { success: true, data: bilanPersonnel() })
    const w = await onglet()

    expect(requetes[0].url).toBe('/lms/classes/900077/resultats')
    expect(texteDes(w, 'tbody th')).toEqual(['Awa', 'Coffi', 'Binta', 'Dédé'])
    const dede = w.findAll('tbody tr')[3].findAll('td').map((c) => c.text())
    expect(dede).toEqual(['—', '—', '—', '—', '1'])
    expect(w.text()).toContain('14.42/20')
    expect(w.text()).toContain('66,67 %')
    expect(w.text()).toContain('Physique (coef. 3)')
  })

  it('la couverture nomme les matières sans évaluation et mène aux évaluations sans note', async () => {
    repondre(200, { success: true, data: bilanPersonnel() })
    const w = await onglet()

    expect(w.text()).toContain('Chimie')
    const lien = w.find('a.lien')
    expect(lien.text()).toBe('Maths 2')
    expect(JSON.parse(lien.attributes('data-to'))).toEqual({ name: 'AdminEvaluationDetails', params: { id: 91 } })
  })

  it('envoie la période saisie', async () => {
    repondre(200, { success: true, data: bilanPersonnel() })
    const w = await onglet()
    await w.find('input[name="du"]').setValue('2026-09-01')
    await w.find('input[name="au"]').setValue('2026-12-20')
    await w.find('form').trigger('submit')
    await flushPromises()

    expect(requetes.at(-1).params).toEqual({ du: '2026-09-01', au: '2026-12-20' })
  })
})

describe('#683 — la vue de l élève', () => {
  it('sa seule ligne, sans case « Mon rang » quand le serveur ne le rend pas', async () => {
    repondre(200, { success: true, data: bilanEleve(false) })
    const w = await onglet()

    expect(w.text()).toContain('Ma moyenne générale')
    expect(w.text()).toContain('14.25/20')
    expect(w.find('[data-test="rang"]').exists()).toBe(false)
    expect(w.find('[data-test="exporter"]').exists()).toBe(false)
    expect(w.find('table').exists()).toBe(false)
  })

  it('son rang quand l école l autorise', async () => {
    repondre(200, { success: true, data: bilanEleve(true) })
    const w = await onglet()

    expect(w.find('[data-test="rang"]').text()).toContain('3')
  })
})

describe('#683 — les refus', () => {
  it.each([
    ['class_not_taught', 403, 'Vous n’enseignez pas dans cette classe'],
    ['not_in_class', 403, 'Vous n’êtes pas inscrit dans cette classe'],
    ['class_out_of_scope', 404, 'plus disponible dans votre établissement'],
  ])('%s : le message du motif, jamais le texte du serveur, sans « Réessayer »', async (reason, status, attendu) => {
    repondre(status, { success: false, message: PIEGE, reason })
    const w = await onglet()

    expect(w.find('[role="alert"]').text()).toContain(attendu)
    expect(w.text()).not.toContain(PIEGE)
    expect(w.text()).not.toContain('Réessayer')
  })

  it('une panne passagère propose « Réessayer »', async () => {
    repondre(503, { success: false, message: PIEGE })
    const w = await onglet()

    expect(w.text()).toContain('Réessayer')
    expect(w.text()).not.toContain(PIEGE)
  })
})

describe('#683 — le CSV', () => {
  it('UTF-8 avec BOM, `;`, virgule décimale, cellule vide pour une valeur absente', () => {
    const csv = csvBilanDeClasse(bilanPersonnel())
    const lignes = csv.split('\r\n')

    expect(csv.startsWith('﻿')).toBe(true)
    expect(lignes[0]).toBe('﻿Rang;Élève;Moyenne générale;Maths;Physique;Notes manquantes')
    expect(lignes[1]).toBe('3;Binta;14,25;18;13;1')
    expect(lignes[2]).toBe(';Dédé;;;;1')
  })

  it('neutralise une formule et échappe les guillemets', () => {
    const bilan = { matieres: [], eleves: [{ nom: '=HYPERLINK("x")', rang: 1, moyenne_generale: 12, notes_manquantes: [] }] }

    expect(csvBilanDeClasse(bilan).split('\r\n')[1]).toBe('1;"\'=HYPERLINK(""x"")";12;0')
  })
})
