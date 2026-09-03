import { ref, onMounted } from 'vue'
import { klassciService } from '@/services/klassci'
import { lmsService } from '@/services/lms'
import lessonService from '@/services/lesson'
import { enrichTeacherClasses } from '@/utils/classStats'
import { mergeClassMeasures } from '@/utils/classMeasures'
import { extractList } from '@/utils/apiList'

function firstDashboardNumber(dashboard, keys) {
  for (const key of keys) {
    const value = key.split('.').reduce((current, part) => current?.[part], dashboard)
    if (value === null || value === undefined || value === '') continue
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  return null
}

/**
 * Somme des effectifs MESURES. `null` si aucune classe n'en porte : additionner
 * des absences donnerait 0, indiscernable d'un etablissement sans etudiant.
 */
function sommeEffectifs(classes) {
  const mesures = classes.map((c) => c.places_occupees).filter((n) => typeof n === 'number')
  return mesures.length === 0 ? null : mesures.reduce((total, n) => total + n, 0)
}

/**
 * Couche données de l'espace enseignant (TeacherHub, #H11 ≤300). Agrège en
 * parallèle classes/matières/dashboard/séances KLASSCI+LMS et calcule les
 * compteurs du hub (classes, matières, leçons, séances à venir, évaluations,
 * étudiants). La vue ne fait plus que câbler `const { … } = useTeacherHub()`.
 */
export function useTeacherHub() {
  const loading = ref(true)
  const stats = ref({
    classes: 0,
    matieres: 0,
    lecons: 0,
    seancesAVenir: 0,
    evaluations: 0,
    etudiants: 0
  })

  async function loadStats() {
    loading.value = true

    try {
      // Charger les donnees rattachees a l enseignant connecte.
      // Quatre sources : le dashboard KLASSCI ne porte NI les lecons (entite
      // LMS qu'il ne connait pas) NI les effectifs. Les y chercher donnait
      // « 0 lecon » sur ce hub alors que l'ecran Lecons en listait 5.
      const [dashboardOutcome, seancesOutcome, lessonsOutcome, referentielOutcome] =
        await Promise.allSettled([
          klassciService.getTeacherDashboard(),
          lmsService.getMyTeachingSeances(),
          lessonService.getLessons(),
          klassciService.getClasses(),
        ])

      const dashboard = dashboardOutcome.status === 'fulfilled' ? dashboardOutcome.value : {}
      const seances = seancesOutcome.status === 'fulfilled' ? seancesOutcome.value : { data: [] }
      const referentiel = referentielOutcome.status === 'fulfilled' ? referentielOutcome.value : null

      const classes = Array.isArray(dashboard?.classes) ? dashboard.classes : []
      const matieres = Array.isArray(dashboard?.matieres) ? dashboard.matieres : []
      const teacherClasses = enrichTeacherClasses(classes, matieres)

      // Compter les classes
      stats.value.classes = firstDashboardNumber(dashboard, [
        'statistiques.total_classes',
        'nb_classes',
        'classes_count'
      ]) ?? teacherClasses.length

      // Compter les matieres
      stats.value.matieres = firstDashboardNumber(dashboard, [
        'statistiques.total_matieres',
        'nb_matieres',
        'matieres_count'
      ]) ?? matieres.length

      // Lecons : le dashboard d'abord (s'il les portait un jour), sinon le LMS
      // qui en est la seule source. Une panne vaut `null` — « non mesure » —
      // jamais 0, qui se lirait « aucune lecon creee ».
      stats.value.lecons = firstDashboardNumber(dashboard, ['nb_lecons', 'total_lessons'])
        ?? (lessonsOutcome.status === 'fulfilled' ? extractList(lessonsOutcome.value).length : null)

      // Compter les seances a venir
      const seancesData = extractList(seances)
      const now = new Date()
      stats.value.seancesAVenir = seancesData.filter(s => {
        const dateSeance = new Date(s.programmation?.date || s.date_seance)
        return dateSeance >= now
      }).length

      // Evaluations : `nb_evaluations` n'existe pas dans le payload reel ; le
      // compte vit sous `statistiques.evaluations.total_programmees`.
      stats.value.evaluations = firstDashboardNumber(dashboard, [
        'nb_evaluations',
        'evaluations_count',
        'statistiques.evaluations.total_programmees'
      ]) ?? (Array.isArray(dashboard?.evaluations) ? dashboard.evaluations.length : null)

      // Compter les etudiants sans charger les rosters de toutes les classes.
      stats.value.etudiants = firstDashboardNumber(dashboard, [
        'statistiques.total_etudiants',
        'nb_etudiants',
        'etudiants_count',
        'students_count'
      ]) ?? sommeEffectifs(mergeClassMeasures(classes, referentiel))

      console.log('[HUB] Stats chargees:', stats.value)
    } catch (error) {
      console.error('[HUB] Erreur chargement stats:', error)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    loadStats()
  })

  return { loading, stats, loadStats }
}
