import { computed } from 'vue'
import { klassciService } from '@/services/klassci'
import { lmsService } from '@/services/lms'
import lessonService from '@/services/lesson'
import { useCachedResource } from '@/composables/useCachedResource'
import { enrichTeacherClasses } from '@/utils/classStats'
import { mergeClassMeasures } from '@/utils/classMeasures'
import { extractList } from '@/utils/apiList'
import { coalesceNumberFrom } from '@/utils/coalesceNumber'

/** Aucun compteur mesuré : l'état avant toute réponse, et après une panne froide. */
const AUCUNE_MESURE = Object.freeze({
  classes: null,
  matieres: null,
  lecons: null,
  seancesAVenir: null,
  evaluations: null,
  etudiants: null
})

function firstDashboardNumber(dashboard, keys) {
  return coalesceNumberFrom(dashboard, keys)
}

/**
 * Somme des effectifs MESURES. `null` si aucune classe n'en porte : additionner
 * des absences donnerait 0, indiscernable d'un etablissement sans etudiant.
 */
function sommeEffectifs(classes) {
  const mesures = classes.map((c) => c.places_occupees).filter((n) => typeof n === 'number')
  return mesures.length === 0 ? null : mesures.reduce((total, n) => total + n, 0)
}

function compterSeancesAVenir(seances) {
  const now = new Date()
  return extractList(seances).filter((s) => {
    const dateSeance = new Date(s.programmation?.date || s.date_seance)
    return dateSeance >= now
  }).length
}

/**
 * Interroge les quatre sources et n'en tire QUE des compteurs mesurés.
 *
 * Quatre sources : le dashboard KLASSCI ne porte NI les leçons (entité LMS
 * qu'il ne connaît pas) NI les effectifs.
 *
 * Une source qui n'a pas répondu laisse ses compteurs à `null`. Le piège est
 * qu'un dashboard manquant se lit comme un dashboard vide : `[].length` rend
 * alors un `0` qui a toutes les apparences d'une mesure, et le hub annonçait
 * « 0 classe » — soit « vous n'enseignez nulle part » — pour une simple
 * coupure réseau.
 *
 * Rejette si AUCUNE source n'a répondu : c'est ce qui fait conserver les
 * derniers compteurs connus au lieu de les écraser (cf. useCachedResource).
 */
async function mesurerCompteurs() {
  const resultats = await Promise.allSettled([
    klassciService.getTeacherDashboard(),
    lmsService.getMyTeachingSeances(),
    lessonService.getLessons(),
    klassciService.getClasses()
  ])
  const [dashboardIssue, seancesIssue, lessonsIssue, referentielIssue] = resultats

  if (resultats.every((issue) => issue.status === 'rejected')) {
    throw dashboardIssue.reason
  }

  const dashboardRepondu = dashboardIssue.status === 'fulfilled'
  const dashboard = dashboardRepondu ? dashboardIssue.value : null
  const referentiel = referentielIssue.status === 'fulfilled' ? referentielIssue.value : null

  const classes = Array.isArray(dashboard?.classes) ? dashboard.classes : []
  const matieres = Array.isArray(dashboard?.matieres) ? dashboard.matieres : []
  const teacherClasses = enrichTeacherClasses(classes, matieres)

  // Les leçons ont leur propre source : elles restent mesurables même quand le
  // dashboard tombe, et inversement.
  const lecons = firstDashboardNumber(dashboard, ['nb_lecons', 'total_lessons'])
    ?? (lessonsIssue.status === 'fulfilled' ? extractList(lessonsIssue.value).length : null)

  return {
    classes: dashboardRepondu
      ? (firstDashboardNumber(dashboard, ['statistiques.total_classes', 'nb_classes', 'classes_count'])
        ?? teacherClasses.length)
      : null,

    matieres: dashboardRepondu
      ? (firstDashboardNumber(dashboard, ['statistiques.total_matieres', 'nb_matieres', 'matieres_count'])
        ?? matieres.length)
      : null,

    lecons,

    seancesAVenir: seancesIssue.status === 'fulfilled'
      ? compterSeancesAVenir(seancesIssue.value)
      : null,

    // `nb_evaluations` n'existe pas dans le payload reel ; le compte vit sous
    // `statistiques.evaluations.total_programmees`.
    evaluations: dashboardRepondu
      ? (firstDashboardNumber(dashboard, [
        'nb_evaluations',
        'evaluations_count',
        'statistiques.evaluations.total_programmees'
      ]) ?? (Array.isArray(dashboard?.evaluations) ? dashboard.evaluations.length : null))
      : null,

    // Compter les etudiants sans charger les rosters de toutes les classes.
    etudiants: dashboardRepondu
      ? (firstDashboardNumber(dashboard, [
        'statistiques.total_etudiants',
        'nb_etudiants',
        'etudiants_count',
        'students_count'
      ]) ?? sommeEffectifs(mergeClassMeasures(classes, referentiel)))
      : null
  }
}

/**
 * Couche données de l'espace enseignant (TeacherHub, #H11 ≤300).
 *
 * Les compteurs sont servis depuis le cache (stale-while-revalidate, #224) :
 * les derniers chiffres connus restent à l'écran pendant la revalidation, et
 * SURVIVENT à une coupure — c'est `error` qui dit alors que l'affichage n'est
 * plus frais, pas une rangée de zéros qui prétendrait le contraire.
 */
export function useTeacherHub() {
  const { data, loading, revalidating, error, refresh } = useCachedResource(
    'teacher_hub_stats',
    mesurerCompteurs
  )

  const stats = computed(() => data.value ?? AUCUNE_MESURE)

  return { loading, revalidating, error, stats, loadStats: refresh }
}
