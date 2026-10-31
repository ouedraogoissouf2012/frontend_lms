import { ref, onMounted } from 'vue'
import { klassciService } from '@/services/klassci'
import { dashboard } from '@/services/api'
import { coalesceNumberFrom } from '@/utils/coalesceNumber'

function firstNumber(source, keys) {
  return coalesceNumberFrom(source, keys, 0)
}

// `null` = source refusée, donc NON MESURÉE : rendue « — », jamais 0.
function countItems(value) {
  return Array.isArray(value) ? value.length : null
}

function countStudents(classes) {
  if (!Array.isArray(classes)) return null

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
    classes: null,
    matieres: null,
    enseignants: null,
    etudiants: null,
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
        // Une source refusée rend `null` (non mesurée) : son compteur s'affiche « — »,
        // pas 0. Le bandeau `failed` (#238) continue de prévenir l'admin.
        klassciService.getClasses().catch(() => { failed.push('classes'); return null }),
        klassciService.getMatieres().catch(() => { failed.push('matières'); return null }),
        klassciService.getEnseignants().catch(() => { failed.push('enseignants'); return null }),
        dashboard.getStats().catch(() => { failed.push('statistiques'); return null })
      ])

      if (failed.length > 0) {
        error.value = `Certaines données n'ont pas pu être chargées (${failed.join(', ')}). Les chiffres affichés peuvent être incomplets.`
      }

      const etudiantsFromClasses = countStudents(classes)
      const etudiantsFromStats = dashboardStats ? firstNumber(dashboardStats.data, ['users.students']) : null

      stats.value = {
        classes: countItems(classes),
        matieres: countItems(matieres),
        enseignants: countItems(enseignants),
        // `/dashboard/stats` rend `{ success, data: { users, lessons, quizzes, forum,
        // notifications, recent_activity } }` (AdminDashboardService::aggregate) :
        // les compteurs sont SOUS `data`. Lus à la racine, ils valaient toujours 0.
        // Les classes d'abord ; sinon les statistiques ; `null` si aucune des deux n'a répondu.
        etudiants: etudiantsFromClasses || (etudiantsFromStats ?? etudiantsFromClasses),
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
