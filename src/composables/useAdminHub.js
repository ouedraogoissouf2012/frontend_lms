import { ref, onMounted } from 'vue'
import { klassciService } from '@/services/klassci'
import { dashboard } from '@/services/api'
import { coalesceNumberFrom } from '@/utils/coalesceNumber'

function firstNumber(source, keys) {
  return coalesceNumberFrom(source, keys, 0)
}

function countItems(value) {
  return Array.isArray(value) ? value.length : 0
}

function countStudents(classes) {
  if (!Array.isArray(classes)) return 0

  return classes.reduce((sum, classe) => {
    const count = firstNumber(classe, [
      'places_occupees',
      'nb_etudiants',
      'etudiants_count',
      'students_count'
    ])
    return sum + count
  }, 0)
}

/**
 * Couche données d'AdminHub (#G1 ≤300) : charge en parallèle les compteurs
 * (classes, matières, enseignants) et les statistiques du dashboard admin.
 * La vue ne fait plus que câbler l'affichage.
 */
export function useAdminHub() {
  const loading = ref(true)
  const error = ref(null) // #238 : signale un chargement partiel (chiffres incomplets)
  const stats = ref({
    classes: 0,
    matieres: 0,
    enseignants: 0,
    etudiants: 0,
    seances: 0,
    evaluations: 0
  })

  async function loadStats() {
    loading.value = true
    error.value = null

    try {
      // #238 : chaque source garde son fallback (une source en panne ne casse pas
      // tout le hub), mais on RECENSE les échecs pour prévenir l'admin que les
      // chiffres sont incomplets — au lieu d'afficher 0 en silence.
      const failed = []
      const [classes, matieres, enseignants, dashboardStats] = await Promise.all([
        klassciService.getClasses().catch(() => { failed.push('classes'); return [] }),
        klassciService.getMatieres().catch(() => { failed.push('matières'); return [] }),
        klassciService.getEnseignants().catch(() => { failed.push('enseignants'); return [] }),
        dashboard.getStats().catch(() => { failed.push('statistiques'); return {} })
      ])

      if (failed.length > 0) {
        error.value = `Certaines données n'ont pas pu être chargées (${failed.join(', ')}). Les chiffres affichés peuvent être incomplets.`
      }

      const etudiantsFromClasses = countStudents(classes)

      stats.value = {
        classes: countItems(classes),
        matieres: countItems(matieres),
        enseignants: countItems(enseignants),
        etudiants: etudiantsFromClasses || firstNumber(dashboardStats, [
          'users.students',
          'total_etudiants',
          'nb_etudiants',
          'students',
          'students_count'
        ]),
        seances: firstNumber(dashboardStats, [
          'seances.total',
          'sessions.total',
          'total_seances',
          'nb_seances'
        ]),
        evaluations: firstNumber(dashboardStats, [
          'quizzes.total',
          'evaluations.total',
          'total_evaluations',
          'nb_evaluations'
        ])
      }

      console.log('[ADMIN HUB] Stats chargées:', stats.value)
    } catch (error) {
      console.error('[ADMIN HUB] Erreur chargement stats:', error)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    loadStats()
  })

  return { loading, error, stats, loadStats }
}
