import { ref, onMounted } from 'vue'
import { klassciService } from '@/services/klassci'
import { lmsService } from '@/services/lms'
import { enrichTeacherClasses } from '@/utils/classStats'
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
      const [dashboard, seances] = await Promise.all([
        klassciService.getTeacherDashboard().catch(() => ({})),
        lmsService.getMyTeachingSeances().catch(() => ({ data: [] }))
      ])

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

      // Compter les lecons depuis le dashboard
      stats.value.lecons = dashboard?.nb_lecons || dashboard?.total_lessons || 0

      // Compter les seances a venir
      const seancesData = extractList(seances)
      const now = new Date()
      stats.value.seancesAVenir = seancesData.filter(s => {
        const dateSeance = new Date(s.programmation?.date || s.date_seance)
        return dateSeance >= now
      }).length

      // Compter les evaluations actives
      stats.value.evaluations = dashboard?.nb_evaluations || dashboard?.evaluations_count || 0

      // Compter les etudiants sans charger les rosters de toutes les classes.
      stats.value.etudiants = firstDashboardNumber(dashboard, [
        'statistiques.total_etudiants',
        'nb_etudiants',
        'etudiants_count',
        'students_count'
      ]) ?? teacherClasses.reduce((sum, classe) => sum + (classe.places_occupees || 0), 0)

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
