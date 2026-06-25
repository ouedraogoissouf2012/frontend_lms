import { ref, onMounted } from 'vue'
import { klassciService } from '@/services/klassci'
import { lmsService } from '@/services/lms'

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
      // Charger les donnees en parallele
      const [classes, matieres, dashboard, seances] = await Promise.all([
        klassciService.getClasses().catch(() => []),
        klassciService.getMatieres().catch(() => []),
        klassciService.getTeacherDashboard().catch(() => ({})),
        lmsService.getMyTeachingSeances().catch(() => ({ data: [] }))
      ])

      // Compter les classes
      stats.value.classes = Array.isArray(classes) ? classes.length : 0

      // Compter les matieres
      stats.value.matieres = Array.isArray(matieres) ? matieres.length : 0

      // Compter les lecons depuis le dashboard
      stats.value.lecons = dashboard?.nb_lecons || dashboard?.total_lessons || 0

      // Compter les seances a venir
      const seancesData = seances?.data || []
      const now = new Date()
      stats.value.seancesAVenir = seancesData.filter(s => {
        const dateSeance = new Date(s.programmation?.date || s.date_seance)
        return dateSeance >= now
      }).length

      // Compter les evaluations actives
      stats.value.evaluations = dashboard?.nb_evaluations || dashboard?.evaluations_count || 0

      // Compter les etudiants total (depuis les classes)
      let totalEtudiants = 0
      for (const classe of (Array.isArray(classes) ? classes : [])) {
        try {
          const etudiants = await klassciService.getClasseEtudiants(classe.id)
          totalEtudiants += etudiants?.length || 0
        } catch (e) {
          // Ignorer les erreurs
        }
      }
      stats.value.etudiants = totalEtudiants

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
