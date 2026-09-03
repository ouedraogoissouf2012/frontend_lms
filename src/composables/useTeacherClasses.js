import { ref, onMounted } from 'vue'
import { klassciService } from '@/services/klassci'
import { readCache, writeCache } from '@/services/cache'
import { logError } from '@/services/errorHandler'
import { enrichTeacherClasses } from '@/utils/classStats'
import { mergeClassMeasures } from '@/utils/classMeasures'

const TEACHER_CLASSES_CACHE_KEY = 'teacher_classes_dashboard_v2'

/**
 * Couche donnees de TeacherClasses (#H9 ≤300). Charge les classes de
 * l enseignant, les enrichit (effectifs, nb matieres) et gere cache +
 * rafraichissement en arriere-plan. La vue ne fait plus que cabler.
 */
export function useTeacherClasses() {
  const classes = ref([])
  const loading = ref(false)
  const error = ref(null)

  /**
   * Charge les classes de l'enseignant AVEC leurs effectifs.
   *
   * Deux sources, en parallele : le tableau de bord dit QUELLES classes sont les
   * siennes, mais ne porte ni effectif ni capacite ; `/proxy/classes` les porte,
   * pour tout l'etablissement et en UN appel. Interroger chaque classe couterait
   * un aller-retour par carte affichee.
   *
   * L'echec du referentiel n'est pas fatal : les mesures restent `null` (rendues
   * « — »), plutot qu'un chiffre invente ou un ecran vide.
   */
  async function fetchClasses() {
    const [dashboardOutcome, referentielOutcome] = await Promise.allSettled([
      klassciService.getTeacherDashboard(),
      klassciService.getClasses(),
    ])

    if (dashboardOutcome.status === 'rejected') throw dashboardOutcome.reason

    const dashboard = dashboardOutcome.value
    const rawClasses = Array.isArray(dashboard?.classes) ? dashboard.classes : []
    const dashboardMatieres = Array.isArray(dashboard?.matieres) ? dashboard.matieres : []
    const referentiel = referentielOutcome.status === 'fulfilled' ? referentielOutcome.value : null

    if (referentielOutcome.status === 'rejected') {
      logError(referentielOutcome.reason, '[useTeacherClasses] effectifs')
    }

    return enrichTeacherClasses(mergeClassMeasures(rawClasses, referentiel), dashboardMatieres)
  }

  async function loadClasses() {
    // Verifier le cache
    const cachedData = readCache(TEACHER_CLASSES_CACHE_KEY)
    if (cachedData !== null) {
      console.log('[CACHE] Classes chargées depuis le cache')
      classes.value = cachedData
      loading.value = false
      // Rafraîchir en arrière-plan
      refreshInBackground()
      return
    }

    loading.value = true
    error.value = null

    try {
      classes.value = await fetchClasses()

      // Mettre en cache
      writeCache(TEACHER_CLASSES_CACHE_KEY, classes.value)

      console.log('[OK] Classes enrichies:', classes.value)
    } catch (err) {
      console.error('[ERREUR] Erreur chargement classes:', err)
      error.value = 'Impossible de charger vos classes. Veuillez réessayer.'
    } finally {
      loading.value = false
    }
  }

  async function refreshInBackground() {
    try {
      classes.value = await fetchClasses()

      writeCache(TEACHER_CLASSES_CACHE_KEY, classes.value)

      console.log('[BACKGROUND] Classes rafraîchies')
    } catch (error) {
      console.warn('[BACKGROUND] Erreur rafraîchissement:', error)
    }
  }

  onMounted(() => {
    loadClasses()
  })

  return { classes, loading, error, loadClasses }
}
