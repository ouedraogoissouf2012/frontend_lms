/**
 * Tableaux de bord : un compteur sans source se lit « — », jamais un 0 inventé.
 *
 * Constat E2E (09/11/2026, école créée depuis le LMS) : /teacher/dashboard affichait « Leçons
 * Créées 0 », « Étudiants Totaux 0 » et « Séances à venir 0 » pour un enseignant qui avait créé
 * 3 leçons dans 2 classes de 4 et 2 élèves, et une séance demain. KLASSCI refuse ce compte, le
 * repli (`buildTeacherDashboardFallback`) prend le relais, et ses comptages rendaient 0 pour
 * « rien de mesuré » :
 * - `countStudents` des classes sans effectif ;
 * - `countLessons` des matières qui ne portent pas leurs leçons ;
 * - `.length` d'une liste de séances que le serveur a refusée.
 * Même famille, côté admin : le compteur « Étudiants » de /admin/dashboard
 * (`deriveInstitutionCounters`) additionnait `places_occupees || 0`.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { buildTeacherDashboardFallback, deriveTeacherCounters } from '@/utils/teacherDashboard'
import { deriveInstitutionCounters } from '@/utils/classStats'
import DashboardStatCards from '@/components/teacher/DashboardStatCards.vue'

const refus = () => Promise.reject(new Error('refusé'))
const ENSEIGNANT = { id: 3, name: 'Enseignant Un E2E', email: 'ens1@example.test' }

/** Le service LMS tel qu'une école créée depuis le LMS le voit aujourd'hui. */
function lms({ matieres, seances } = {}) {
  return {
    getEnseignants: vi.fn(refus), // /lms/enseignants : 503 (lot 3)
    getMyMatieres: vi.fn(() => (matieres === undefined ? refus() : Promise.resolve({ success: true, data: matieres }))),
    getMyTeachingSeances: vi.fn(() => (seances === undefined ? refus() : Promise.resolve({ success: true, data: seances }))),
  }
}
const MATIERES = [{ id: 1, nom: 'Mathematiques', classes: [{ id: 5 }, { id: 6 }] }]

describe('repli du tableau de bord enseignant : rien de mesuré n’est un nombre', () => {
  it('effectif des classes inconnu → total des étudiants non mesuré', async () => {
    const d = await buildTeacherDashboardFallback(lms({ matieres: MATIERES, seances: [] }), ENSEIGNANT, null)
    expect(d.statistiques.total_etudiants).toBeNull()
  })

  it('effectif connu d’une classe seulement → non mesuré (un total partiel mentirait)', async () => {
    const m = [{ id: 1, nom: 'Mathematiques', classes: [{ id: 5, nb_etudiants: 4 }, { id: 6 }] }]
    const d = await buildTeacherDashboardFallback(lms({ matieres: m, seances: [] }), ENSEIGNANT, null)
    expect(d.statistiques.total_etudiants).toBeNull()
  })

  it('effectif connu de chaque classe → la somme', async () => {
    const m = [{ id: 1, nom: 'Mathematiques', classes: [{ id: 5, nb_etudiants: 4 }, { id: 6, nb_etudiants: 2 }] }]
    const d = await buildTeacherDashboardFallback(lms({ matieres: m, seances: [] }), ENSEIGNANT, null)
    expect(d.statistiques.total_etudiants).toBe(6)
  })

  it('leçons : le total du LMS quand il a répondu ; sinon non mesuré, jamais 0', async () => {
    const avec = await buildTeacherDashboardFallback(lms({ matieres: MATIERES, seances: [] }), ENSEIGNANT, { lessons: { total: 3 } })
    expect(avec.statistiques.total_lecons).toBe(3)
    const sans = await buildTeacherDashboardFallback(lms({ matieres: MATIERES, seances: [] }), ENSEIGNANT, null)
    expect(sans.statistiques.total_lecons).toBeNull()
  })

  it('séances refusées par le serveur → liste et compteur du jour non mesurés', async () => {
    const d = await buildTeacherDashboardFallback(lms({ matieres: MATIERES }), ENSEIGNANT, null)
    expect(d.seances).toBeNull()
    expect(d.statistiques.seances_aujourdhui).toBeNull()
  })

  it('séances obtenues et vides → un vrai 0', async () => {
    const d = await buildTeacherDashboardFallback(lms({ matieres: MATIERES, seances: [] }), ENSEIGNANT, null)
    expect(d.seances).toEqual([])
    expect(d.statistiques.seances_aujourdhui).toBe(0)
  })

  it('le repli ne demande pas les évaluations : non mesurées', async () => {
    const d = await buildTeacherDashboardFallback(lms({ matieres: MATIERES, seances: [] }), ENSEIGNANT, null)
    expect(d.evaluations).toBeNull()
  })
})

describe('cartes du tableau de bord enseignant : « — » pour une liste non mesurée', () => {
  const valeurs = (w) => w.findAll('.stat-value, .stat-number, p').map((n) => n.text()).filter((t) => t === '—')

  it('séances et évaluations non mesurées → deux « — »', () => {
    const w = mount(DashboardStatCards, { props: { dashboardData: { matieres: [{ id: 1 }], classes: [{ id: 5 }], evaluations: null, seances: null } } })
    expect(valeurs(w)).toHaveLength(2)
  })

  it('listes obtenues (même vides) → aucun « — »', () => {
    const w = mount(DashboardStatCards, { props: { dashboardData: { matieres: [], classes: [], evaluations: [], seances: [] } } })
    expect(valeurs(w)).toHaveLength(0)
  })
})

describe('compteur « Étudiants » de l’établissement (/admin/dashboard, profil, statistiques)', () => {
  it('une classe sans effectif → non mesuré', () => {
    expect(deriveInstitutionCounters({ classes: [{ id: 1, nb_etudiants: 4 }, { id: 2 }] }).nb_etudiants).toBeNull()
  })

  it('chaque classe mesurée, sous n’importe laquelle de ses clés d’effectif → la somme', () => {
    expect(deriveInstitutionCounters({ classes: [{ id: 1, nb_etudiants: 4 }, { id: 2, effectif: 2 }] }).nb_etudiants).toBe(6)
  })

  it('aucune classe obtenue → non mesuré ; zéro classe obtenue → 0', () => {
    expect(deriveInstitutionCounters({}).nb_etudiants).toBeNull()
    expect(deriveInstitutionCounters({ classes: [] }).nb_etudiants).toBe(0)
  })

describe('repli par la fiche enseignant (/lms/enseignants répond) : même règle', () => {
  const avecFiche = (fiche, reste = {}) => ({
    getEnseignants: vi.fn(() => Promise.resolve({ success: true, data: [{ id: 3, ...fiche }] })),
    getMyMatieres: vi.fn(() => Promise.resolve({ success: true, data: reste.matieres ?? [] })),
    getMyTeachingSeances: vi.fn(() => Promise.resolve({ success: true, data: reste.seances ?? [] })),
  })

  it('une fiche sans séances ni évaluations : non mesurées, jamais un 0', async () => {
    const fiche = { matieres: [{ id: 1, nom: 'Mathematiques', classes: [{ id: 5, nb_etudiants: 4 }] }] }
    const d = await buildTeacherDashboardFallback(avecFiche(fiche), ENSEIGNANT, null)
    expect(d.seances).toBeNull()
    expect(d.evaluations).toBeNull()
    expect(d.statistiques.seances_aujourdhui).toBeNull()
    expect(d.statistiques.evaluations_en_cours).toBeNull()
  })

  it('une fiche sans total de leçons : celui du LMS', async () => {
    const fiche = { matieres: [{ id: 1, nom: 'Mathematiques', classes: [{ id: 5, nb_etudiants: 4 }] }] }
    const d = await buildTeacherDashboardFallback(avecFiche(fiche), ENSEIGNANT, { lessons: { total: 3 } })
    expect(d.statistiques.total_lecons).toBe(3)
  })

  it('une fiche vide ne court-circuite pas le repli parce que le LMS compte des leçons', async () => {
    const lms = avecFiche({}, { matieres: [{ id: 2, nom: 'Francais', classes: [{ id: 6, nb_etudiants: 2 }] }] })
    const d = await buildTeacherDashboardFallback(lms, ENSEIGNANT, { lessons: { total: 3 } })
    expect(lms.getMyMatieres).toHaveBeenCalled()
    expect(d.matieres).toHaveLength(1)
  })
})

describe('compteur du chemin nominal (KLASSCI répond) : pas de somme partielle', () => {
  it('une classe sans effectif → total des étudiants non mesuré', () => {
    expect(deriveTeacherCounters({ classes: [{ id: 5, nb_etudiants: 4 }, { id: 6 }] }, null).total_etudiants).toBeNull()
  })
})
})
