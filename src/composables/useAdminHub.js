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
    // `null` = NON MESURÉ, rendu « — » : le serveur ne compte ni l'un ni l'autre (cf. loadStats).
    seances: null,
    evaluations: null
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
        // `/dashboard/stats` rend `{ success, data: { users, lessons, quizzes, forum,
        // notifications, recent_activity } }` (AdminDashboardService::aggregate) :
        // les compteurs sont SOUS `data`. Lus à la racine, ils valaient toujours 0.
        etudiants: etudiantsFromClasses || firstNumber(dashboardStats?.data, ['users.students']),
        // Aucun compteur de séances ni d'évaluations dans cette réponse ; `quizzes.total`
        // compte des QUIZ, pas des évaluations. Non mesuré → « — », jamais un 0.
        seances: null,
        evaluations: null
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
