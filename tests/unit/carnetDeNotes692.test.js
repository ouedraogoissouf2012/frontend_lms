/**
 * #692 (lms_backend#1698) : le carnet de notes d'une classe à l'écran, dans l'onglet « Résultats ».
 *
 * Contrat : `GET /lms/classes/{id}/resultats`, chaque ligne porte `cellules` =
 * `[{evaluation_id, etat, note}]`, `etat` parmi `rendu | a_corriger | en_retard | manquant`, dans
 * l'ordre de `evaluations`. Seule une case `rendu` porte une note. L'élève n'a que sa ligne.
 *
 * Ici le VRAI client HTTP (api.js et ses intercepteurs) : seul l'adaptateur réseau est remplacé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { csvCarnetDeNotes } from '@/utils/csvCarnetDeNotes'
import { csvBilanDeClasse } from '@/utils/csvBilanDeClasse'
import { downloadBlob } from '@/utils/downloadBlob'
import ClasseResultatsTab from '@/components/classes/ClasseResultatsTab.vue'

vi.mock('@/utils/downloadBlob', () => ({ downloadBlob: vi.fn() }))

let adaptateurOrigine

function repondre(data) {
  api.defaults.adapter = async (config) => ({
    status: 200, statusText: '', data: JSON.stringify({ success: true, data }), headers: { 'content-type': 'application/json' }, config,
  })
}

const MATIERES = [{ matiere_id: 11, libelle: 'Maths', coefficient: 1 }, { matiere_id: 12, libelle: 'Physique', coefficient: 3 }]
const EVALUATIONS = [
  { id: 91, titre: 'Contrôle 1', matiere_id: 11, date_evaluation: null, coefficient: 1 },
  { id: 92, titre: 'TP optique', matiere_id: 12, date_evaluation: null, coefficient: 1 },
  { id: 93, titre: 'Devoir maison', matiere_id: 11, date_evaluation: null, coefficient: 1 },
]
const cases = (c91, c92, c93) => [
  { evaluation_id: 91, ...c91 }, { evaluation_id: 92, ...c92 }, { evaluation_id: 93, ...c93 },
]
const RENDU = (note) => ({ etat: 'rendu', note })
const ETAT = (etat) => ({ etat, note: null })

const ligne = (nom, moyenne, cellules) => ({
  compte_id: nom.length, nom, moyenne_generale: moyenne, rang: 1,
  matieres: [{ matiere_id: 11, moyenne }, { matiere_id: 12, moyenne: null }], notes: [], notes_manquantes: [], cellules,
})
const bilanPersonnel = () => ({
  classe: { id: 5, libelle: '6e A' }, periode: { du: null, au: null }, source: 'lms', seuil_reussite: 10,
  evaluations: EVALUATIONS, matieres: MATIERES,
  eleves: [
    ligne('Awa', 15.5, cases(RENDU(15.5), ETAT('a_corriger'), ETAT('en_retard'))),
    ligne('=HYPERLINK("x")', null, cases(ETAT('manquant'), ETAT('manquant'), ETAT('manquant'))),
  ],
  statistiques: { effectif: 2, classes: 1, moyenne_classe: 15.5, taux_reussite: 100 },
  couverture: { matieres_sans_evaluation: [], evaluations_sans_note: [] },
})

const RouterLink = { props: ['to'], template: '<a><slot /></a>' }
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
  vi.mocked(downloadBlob).mockClear()
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('#692 — le personnel lit le carnet de la classe', () => {
  it('une ligne par élève, une colonne par évaluation, avec sa matière', async () => {
    repondre(bilanPersonnel())
    const w = await onglet()

    expect(w.findAll('[data-test="ligne"]')).toHaveLength(2)
    expect(texteDes(w, '[data-test="colonne"]')).toEqual(['Contrôle 1 Maths', 'TP optique Physique', 'Devoir maison Maths'])
  })

  it('une case rendue montre sa note ; les autres, leur état en toutes lettres', async () => {
    repondre(bilanPersonnel())
    const w = await onglet()

    const [awa, absent] = w.findAll('[data-test="ligne"]')
    expect(awa.findAll('[data-test="case"]').map((c) => c.text())).toEqual(['15.5/20', 'À corriger', 'En retard'])
    expect(absent.findAll('[data-test="case"]').map((c) => c.text())).toEqual(['Manquant', 'Manquant', 'Manquant'])
    expect(w.find('.carnet-legende').text()).toContain('remise refusée après l’échéance')
  })

  it('les cases suivent les identifiants, pas l ordre dans lequel le serveur les range', async () => {
    const bilan = bilanPersonnel()
    bilan.eleves[0].cellules.reverse()
    repondre(bilan)
    const w = await onglet()

    expect(w.findAll('[data-test="ligne"]')[0].findAll('[data-test="case"]').map((c) => c.text())).toEqual(['15.5/20', 'À corriger', 'En retard'])
  })

  it('aucune évaluation sur la période : une phrase, pas une grille vide', async () => {
    repondre({ ...bilanPersonnel(), evaluations: [], eleves: bilanPersonnel().eleves.map((e) => ({ ...e, cellules: [] })) })
    const w = await onglet()

    expect(w.find('.carnet-grille').exists()).toBe(false)
    expect(w.find('.carnet-vide').text()).toContain('Aucune évaluation')
  })

  it('un serveur d avant le carnet (sans cellules) : ni grille ni export du carnet, le classement reste', async () => {
    const bilan = bilanPersonnel()
    bilan.eleves.forEach((e) => delete e.cellules)
    repondre(bilan)
    const w = await onglet()

    expect(w.find('.carnet').exists()).toBe(false)
    expect(w.find('[data-test="exporter-carnet"]').exists()).toBe(false)
    expect(w.find('.classement').exists()).toBe(true)
  })
})

describe('#692 — l élève ne lit que ses cases', () => {
  it('« Mes notes » sous ses moyennes, et aucune grille de la classe', async () => {
    useAuthStore().setSession({ user: { id: 3, role: 'etudiant' }, token: 't' }, {})
    const { statistiques: _s, couverture: _c, ...reste } = bilanPersonnel()
    repondre({ ...reste, eleves: [reste.eleves[0]] })
    const w = await onglet()

    expect(w.find('.carnet').exists()).toBe(false)
    expect(texteDes(w, '[data-test="mes-notes"] li')).toEqual([
      'Contrôle 1 · Maths15.5/20', 'TP optique · PhysiqueÀ corriger', 'Devoir maison · MathsEn retard',
    ])
  })
})

describe('#692 — l export du carnet', () => {
  it('une colonne par évaluation : la note reste un nombre, une case sans note porte son état', () => {
    const [entete, awa, absent] = csvCarnetDeNotes(bilanPersonnel()).replace(/^﻿/, '').split('\r\n')

    expect(entete).toBe('Élève;Moyenne générale;Contrôle 1 (Maths);TP optique (Physique);Devoir maison (Maths)')
    expect(awa).toBe('Awa;15,5;15,5;À corriger;En retard')
    expect(absent).toBe('"\'=HYPERLINK(""x"")";;Manquant;Manquant;Manquant')
  })

  it('le bouton télécharge le carnet sous son propre nom', async () => {
    repondre(bilanPersonnel())
    const w = await onglet()
    await w.find('[data-test="exporter-carnet"]').trigger('click')

    expect(downloadBlob).toHaveBeenCalledTimes(1)
    const [blob, nom] = vi.mocked(downloadBlob).mock.calls[0]
    expect(nom).toBe('carnet-de-notes-6e-A.csv')
    // Les octets, BOM compris (`Blob.text()` le retire à la lecture).
    expect(Array.from(new Uint8Array(await blob.arrayBuffer()))).toEqual(Array.from(new TextEncoder().encode(csvCarnetDeNotes(bilanPersonnel()))))
  })

  it('le classement (#683) garde exactement son export après l extraction de l échappement', () => {
    expect(csvBilanDeClasse(bilanPersonnel()).split('\r\n')[2]).toBe('1;"\'=HYPERLINK(""x"")";;;;0')
  })
})
