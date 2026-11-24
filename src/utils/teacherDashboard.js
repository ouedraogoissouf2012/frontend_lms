import { extractList, pickList } from './apiList'
import { enrichTeacherClasses } from './classStats'
import { countLessons, countStudents, listeMesuree, prochainesSeancesMesurees } from './teacherDashboardCounts'
import { toId } from './toId'
import { coalesceNumber } from './coalesceNumber'
import { measuredSum } from './measuredSum'
import { measureClassStudentCount } from './classMeasures'

const EMPTY_TEACHER_DASHBOARD = {
  matieres: [],
  classes: [],
  evaluations: [],
  lessons: [],
  statistiques: {},
}

export function normalizeTeacherDashboard(data = {}) {
  return {
    ...EMPTY_TEACHER_DASHBOARD,
    ...(data && typeof data === 'object' ? data : {}),
  }
}

export function normalizeTeacherDashboardPayload(response = {}) {
  const candidates = [
    response?.data?.dashboard,
    response?.data?.teacher_dashboard,
    response?.data,
    response?.dashboard,
    response?.teacher_dashboard,
    response,
  ]

  const payload = candidates.find(candidate => candidate && typeof candidate === 'object') || {}
  return normalizeTeacherDashboard(payload)
}

function firstNumber(values, fallback = 0) {
  return coalesceNumber(values, fallback)
}

/**
 * #626 (lms_backend#1536) : la fiche du compte connecté se reconnaît par UN seul id, `id_dans_l_annuaire`, que le
 * serveur rend déjà dans l'espace de l'annuaire de l'école (id local en école autonome, identité d'enseignant KLASSCI
 * en école KLASSCI). Plus aucun repli : ni `klassci_id` (un numéro de COMPTE), ni `id` local croisé, ni courriel, ni
 * nom — deux homonymes, un courriel partagé ou un même nombre dans deux espaces donnaient la fiche d'un AUTRE. Un nul
 * ou une clé absente (session antérieure à #1536) ne correspond à rien.
 */
function matchesCurrentTeacher(enseignant, currentUser) {
  const moi = toId(currentUser?.id_dans_l_annuaire ?? currentUser?.klassci_id)
  return Boolean(moi) && toId(enseignant?.id) === moi
}

function findCurrentTeacher(enseignants = [], currentUser) {
  return enseignants.find(enseignant => matchesCurrentTeacher(enseignant, currentUser)) || null
}

function collectClassesFromMatieres(matieres = []) {
  const byId = new Map()

  for (const matiere of matieres) {
    const linkedClasses = [
      ...(Array.isArray(matiere?.classes) ? matiere.classes : []),
      ...(Array.isArray(matiere?.klassci_classes) ? matiere.klassci_classes : []),
    ]

    if (matiere?.classe && typeof matiere.classe === 'object') linkedClasses.push(matiere.classe)
    if (matiere?.klassci_classe && typeof matiere.klassci_classe === 'object') linkedClasses.push(matiere.klassci_classe)

    for (const classe of linkedClasses) {
      const id = toId(classe)
      if (id) byId.set(id, classe)
    }

    for (const idValue of [matiere?.classe_id, matiere?.klassci_classe_id]) {
      const id = toId(idValue)
      if (id && !byId.has(id)) byId.set(id, { id })
    }
  }

  return Array.from(byId.values())
}

function isTodaySeance(seance) {
  const date = seance?.date_seance || seance?.date || seance?.programmation?.date_seance
  return date && String(date).slice(0, 10) === new Date().toISOString().slice(0, 10)
}

function buildDashboardFromTeacher(enseignant, local = null) {
  // #296 : lecture de CHAMP d'objet (enseignant.matieres…) via pickList, distincte
  // du dé-wrap d'enveloppe d'extractList (réservé aux réponses ci-dessous).
  const matieres = pickList(enseignant, ['matieres'])
  const rawClasses = pickList(enseignant, ['classes'])
  const classes = enrichTeacherClasses(
    rawClasses.length > 0 ? rawClasses : collectClassesFromMatieres(matieres),
    matieres
  )
  // Une liste ABSENTE de la fiche n'a pas été mesurée : `null`, jamais `[]` compté 0.
  const seances = listeMesuree(enseignant, 'seances')
  const evaluations = listeMesuree(enseignant, 'evaluations')
  const lessons = listeMesuree(enseignant, 'lessons') ?? listeMesuree(enseignant, 'lecons')
  const statistiques = enseignant?.statistiques || enseignant?.stats || {}

  return normalizeTeacherDashboard({
    matieres,
    classes,
    evaluations,
    prochaines_seances: seances,
    lessons,
    statistiques: {
      ...statistiques,
      total_etudiants: firstNumber([
        statistiques.total_etudiants,
        statistiques.nb_etudiants,
        statistiques.students_count,
      ], countStudents(classes)),
      total_lecons: firstNumber([
        statistiques.total_lecons,
        statistiques.nb_lecons,
        statistiques.lessons_count,
        local?.lessons?.total,
      ], lessons ? lessons.length : countLessons(matieres)),
      seances_aujourdhui: firstNumber([
        statistiques.seances_aujourdhui,
        statistiques.nb_seances_aujourdhui,
      ], seances ? seances.filter(isTodaySeance).length : null),
      evaluations_en_cours: firstNumber([
        statistiques.evaluations_en_cours,
        statistiques.nb_evaluations_en_cours,
      ], evaluations ? evaluations.filter(evaluation => (
        ['active', 'en_cours', 'published'].includes(evaluation?.status || evaluation?.statut)
      )).length : null),
    },
  })
}

export function hasDashboardContent(data) {
  return Boolean(
    data?.matieres?.length ||
    data?.classes?.length ||
    data?.evaluations?.length ||
    data?.prochaines_seances?.length ||
    data?.lessons?.length ||
    Object.values(data?.statistiques || {}).some(value => Number(value) > 0)
  )
}

/**
 * @param {Object} lmsService
 * @param {Object} currentUser
 * @param {Object|null} local - `data` de `GET /dashboard/teacher` (LMS) : porte `lessons.total`,
 *   la seule source des leçons quand KLASSCI refuse ; `null` s'il n'a pas répondu.
 */
export async function buildTeacherDashboardFallback(lmsService, currentUser, local = null) {
  // #296 : ces méthodes lms* normalisent désormais en tableau à la frontière →
  // plus de `keys`. `extractList` reste seulement pour le null-safe (`.catch(()=>null)`).
  const enseignantsResponse = await lmsService.getEnseignants(true).catch(() => null)
  const currentTeacher = findCurrentTeacher(extractList(enseignantsResponse), currentUser)
  if (currentTeacher) {
    // La décision « la fiche suffit » porte sur la FICHE seule : le total de leçons du LMS
    // ne doit pas faire renvoyer une fiche vide au lieu de poursuivre le repli.
    if (hasDashboardContent(buildDashboardFromTeacher(currentTeacher))) {
      return buildDashboardFromTeacher(currentTeacher, local)
    }
  }

  const [matieresResponse, seancesResponse] = await Promise.all([
    lmsService.getMyMatieres().catch(() => null),
    lmsService.getMyTeachingSeances().catch(() => null),
  ])

  const matieres = extractList(matieresResponse)
  const rawClasses = collectClassesFromMatieres(matieres)
  const classes = enrichTeacherClasses(rawClasses, matieres)
  // Une source refusée n'est pas une liste vide : `null`, rendu « — ».
  const seances = seancesResponse ? extractList(seancesResponse) : null

  return normalizeTeacherDashboard({
    matieres,
    classes,
    prochaines_seances: seances,
    // Ce chemin ne demande pas les évaluations : non mesurées.
    evaluations: null,
    statistiques: {
      total_etudiants: matieresResponse ? countStudents(classes) : null,
      total_lecons: coalesceNumber([local?.lessons?.total]) ?? (matieresResponse ? countLessons(matieres) : null),
      seances_aujourdhui: seances ? seances.filter(isTodaySeance).length : null,
    },
  })
}

/** Nombre fini, ou `null` — jamais `0` par défaut. */
function mesure(valeur) {
  const n = typeof valeur === 'string' ? Number(valeur) : valeur
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

/**
 * Effectif total des classes, ou `null` si AUCUNE ne porte la donnée.
 *
 * `countStudents` rend `0` dans ce cas : indiscernable d'un vrai effectif nul.
 * Ici, l'absence remonte telle quelle jusqu'à l'affichage, qui la rend « — ».
 */
function effectifMesure(classes) {
  const liste = Array.isArray(classes) ? classes : []
  if (liste.length === 0) return null
  // Même règle que le repli : une classe sans effectif rend le total non mesuré. L'effectif d'une
  // classe suit LA règle unique (measureClassStudentCount), qui lit aussi `effectif_actuel` (source
  // locale des classes de l'enseignant, R4).
  return measuredSum(liste.map(measureClassStudentCount))
}

/**
 * Les quatre indicateurs du tableau de bord enseignant (#371), chacun demandé
 * à la source qui le DÉTIENT.
 *
 * ## Le défaut que cette fonction supprime
 *
 * `DashboardActivityWidgets.vue` lisait `statistiques.total_etudiants`,
 * `.total_lecons`, `.seances_aujourdhui` et `.evaluations_en_cours` —
 * **quatre clés absentes** de `me/teacher-dashboard`, dont `statistiques` ne
 * porte que `{ heures, evaluations }`. Le `|| 0` rendait quatre zéros
 * permanents. Mesuré à l'écran le 2026-09-10 : « Leçons Créées : 0 » alors que
 * `/api/dashboard/teacher` répondait `lessons.total = 2` dans le MÊME
 * chargement de page.
 *
 * `buildTeacherDashboardFallback` calcule bien ces valeurs, mais il est
 * conditionné à `hasDashboardContent()` faux : KLASSCI rendant 6 matières et
 * 27 évaluations, il ne s'exécute jamais dans le cas nominal.
 *
 * ## Deux mesurables, deux non
 *
 * `total_lecons` vient du LMS — `lessons` est SA table, KLASSCI ne l'a jamais
 * eue. `evaluations_en_cours` se dérive de `programmation.window.is_open`, le
 * signal d'ouverture faisant autorité.
 *
 * `total_etudiants` et `seances_aujourdhui` n'ont **aucune** source dans cette
 * charge : les classes ne portent pas d'effectif, et `prochaines_seances` est
 * toujours vide (#739). Ils valent donc `null`, affiché « — ». Un `0`
 * affirmerait une mesure qu'on n'a pas — règle déjà posée dans `classStats.js`.
 *
 * @param {object|null} klassci Charge `data` de `me/teacher-dashboard`.
 * @param {object|null} local   Charge `data` de `/api/dashboard/teacher`.
 * @returns {{total_etudiants:number|null, total_lecons:number|null,
 *   seances_aujourdhui:number|null, evaluations_en_cours:number|null}}
 */
export function deriveTeacherCounters(klassci, local) {
  const k = klassci && typeof klassci === 'object' ? klassci : {}
  const l = local && typeof local === 'object' ? local : {}
  const evaluations = Array.isArray(k.evaluations) ? k.evaluations : null
  const prochaines = prochainesSeancesMesurees(k)

  return {
    total_etudiants: effectifMesure(k.classes),
    total_lecons: mesure(l?.lessons?.total),
    seances_aujourdhui: prochaines ? prochaines.filter(isTodaySeance).length : null,
    evaluations_en_cours: evaluations
      ? evaluations.filter((e) => e?.programmation?.window?.is_open === true).length
      : null,
  }
}
