/**
 * E4c (contrat back #1042) : dans une école créée depuis le LMS, les fiches classe et matière listent
 * leurs évaluations (`evaluations_programmees`, éléments `source: 'lms_local'`, `has_online: true`,
 * `online_version.id` = l'id LMS). L'audience est décidée par le SERVEUR (l'élève sa liste, l'enseignant
 * les siennes, la gestion toutes) : le front n'ajoute ni ne retire rien.
 * - Fiche classe : le clic envoyait TOUS les rôles vers `AdminEvaluationDetails` (réservée à la gestion)
 *   avec l'id de l'élément ; il suit désormais le rôle et l'id LMS (`online_version.id`), et l'élève
 *   passe par la porte unique (`ouvrirEvaluation`).
 * - Compteur d'évaluations de l'en-tête : « — » tant que rien n'est mesuré (chargement en échec), jamais 0.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  role: 'etudiant', getClasseDetails: vi.fn(), getClasseEtudiants: vi.fn(), getUpcomingSeances: vi.fn(),
  ouvrirEvaluation: vi.fn(), push: vi.fn(), notify: vi.fn(),
}))
vi.mock('@/services/lms', () => ({
  default: {
    // La fiche d'une école LMS passe par la porte locale (route `classe-details-local`).
    getClasseDetailsLocal: (...a) => h.getClasseDetails(...a),
    getClasseEtudiants: (...a) => h.getClasseEtudiants(...a),
    getUpcomingSeances: (...a) => h.getUpcomingSeances(...a),
  },
}))
vi.mock('@/services/api', () => ({ auth: { getUser: () => ({ role: h.role }) } }))
vi.mock('@/composables/useStartEvaluation', () => ({
  useStartEvaluation: () => ({ ouvrirEvaluation: (...a) => h.ouvrirEvaluation(...a) }),
}))
vi.mock('@/composables/useToast', () => ({ toast: { info: (...a) => h.notify(...a), error: vi.fn(), success: vi.fn() } }))

import { routeEvaluationDeClasse } from '@/utils/classeDetails'
import { resolveEvaluationRoute } from '@/utils/matiereDetails'
import { useClasseDetails } from '@/composables/useClasseDetails'
import ClasseDetailsHeader from '@/components/classes/ClasseDetailsHeader.vue'

// La forme E4c (EvaluationProgrammeeLocale::locale) : `id` est l'id LMS, `online_version.id` aussi.
const LOCALE = {
  id: 31, lms_id: 31, titre: 'Contrôle', type: 'lms_pure', duree_minutes: 45, source: 'lms_local',
  matiere: { id: 9, nom: 'Maths' }, has_online: true, online_version: { id: 31, status: 'publiee' },
  programmation: { date_evaluation: null, window: { is_open: true, has_started: true } },
  student_submission: { id: 4, status: 'soumis', score: null, note_sur_20: null },
}
// Dans une école KLASSCI, l'élément porte l'id de la programmation : l'id LMS est online_version.id.
const KLASSCI = { id: 500, titre: 'Devoir', has_online: true, online_version: { id: 77 } }
const SANS_VERSION = { id: 501, titre: 'Programmée' }

describe('fiche classe : un clic suit le rôle et l’id LMS', () => {
  it('1. élève → la porte unique, avec l’id LMS et sa copie', () => {
    expect(routeEvaluationDeClasse(LOCALE, 'etudiant'))
      .toEqual({ ouvrir: { id: 31, student_submission: LOCALE.student_submission } })
  })

  it('2. enseignant → la prévisualisation de SON évaluation', () => {
    expect(routeEvaluationDeClasse(LOCALE, 'enseignant'))
      .toEqual({ route: { name: 'PreviewEvaluation', params: { id: 31 } } })
  })

  it('3. gestion → les résultats, par l’id LMS et jamais par l’id de l’élément', () => {
    for (const role of ['admin', 'superAdmin', 'coordinateur']) {
      expect(routeEvaluationDeClasse(KLASSCI, role))
        .toEqual({ route: { name: 'AdminEvaluationDetails', params: { id: 77 } } })
    }
  })

  it('4. sans version en ligne → la notification existante, aucune route', () => {
    expect(routeEvaluationDeClasse(SANS_VERSION, 'enseignant'))
      .toEqual({ notify: { message: 'Cette évaluation n\'a pas encore de version en ligne', level: 'info' } })
  })
})

async function fiche(role, reponse) {
  h.role = role
  h.getClasseDetails.mockImplementation(reponse)
  let api
  mount(defineComponent({ setup() { api = useClasseDetails(); return () => null } }), {
    global: { mocks: { $route: { name: 'classe-details-local', params: { id: '5' } }, $router: { push: h.push, back: vi.fn() } } },
  })
  await flushPromises()
  return api
}

beforeEach(() => {
  vi.clearAllMocks()
  h.getClasseEtudiants.mockResolvedValue({ success: true, data: { etudiants: [] } })
  h.getUpcomingSeances.mockResolvedValue({ success: true, data: [], meta: {} })
})

describe('useClasseDetails : audience du serveur, clic par rôle, compteur mesuré', () => {
  const servie = (liste, stats = { nombre_evaluations_programmees: liste.length }) => () =>
    Promise.resolve({ success: true, data: { classe: { nom: '6e A' }, evaluations_programmees: liste, statistiques: stats } })

  it('5. élève : le clic ouvre par la porte unique, jamais AdminEvaluationDetails', async () => {
    const c = await fiche('etudiant', servie([LOCALE]))
    c.viewEvaluation(LOCALE)
    expect(h.ouvrirEvaluation).toHaveBeenCalledWith({ id: 31, student_submission: LOCALE.student_submission })
    expect(h.push).not.toHaveBeenCalled()
  })

  it('6. audience : la liste est EXACTEMENT celle du serveur, en un seul appel', async () => {
    const autre = { ...LOCALE, id: 32, lms_id: 32, online_version: { id: 32 } }
    const c = await fiche('enseignant', servie([LOCALE, autre]))
    expect(c.evaluations.value.map((e) => e.id)).toEqual([31, 32])
    expect(h.getClasseDetails).toHaveBeenCalledTimes(1)
  })

  it('7. compteur : null tant que rien n’est mesuré ; sinon le compte du serveur (un vrai 0 reste 0)', async () => {
    const enEchec = await fiche('admin', () => Promise.reject({ response: { status: 500 } }))
    expect(enEchec.compteurEvaluations.value).toBeNull()
    const vide = await fiche('admin', servie([]))
    expect(vide.compteurEvaluations.value).toBe(0)
    const trois = await fiche('admin', servie([LOCALE], { nombre_evaluations_programmees: 3 }))
    expect(trois.compteurEvaluations.value).toBe(3)
  })

  it('8. en-tête : un compteur null se lit « — », jamais 0', () => {
    const w = mount(ClasseDetailsHeader, { props: { classe: { nom: '6e A' }, etudiantsCount: null, matieresCount: 2, evaluationsCount: null } })
    const valeurs = w.findAll('.stat-value-header').map((v) => v.text())
    expect(valeurs).toEqual(['2', '—'])
  })
})

describe('fiche matière : un élément local E4c suit B-1', () => {
  it('9. enseignant → prévisualisation ; élève → la porte unique, avec la copie masquée telle quelle', () => {
    expect(resolveEvaluationRoute(LOCALE, { role: 'enseignant' }))
      .toEqual({ route: { name: 'PreviewEvaluation', params: { id: 31 } } })
    expect(resolveEvaluationRoute(LOCALE, { role: 'etudiant' }))
      .toEqual({ ouvrir: { id: 31, student_submission: LOCALE.student_submission } })
  })
})
