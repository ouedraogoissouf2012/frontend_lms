import { ref, onMounted } from 'vue'
import { auth } from '@/services/api'
import { klassciService } from '@/services/klassci'
import { analyticsService } from '@/services/analytics'
import { readCache, writeCache } from '@/services/cache'
import { logError } from '@/services/errorHandler'
import { deriveInstitutionCounters } from '@/utils/classStats'

/**
 * Couche données d'AdminStats (#H3 ≤300) : statistiques globales de la plateforme
 * (utilisateurs, classes/matières, séances/visio, évaluations + compteurs annexes).
 *
 * L'écran affichait ses SEIZE compteurs à zéro sans émettre la moindre requête :
 * il lisait `user.admin_data.statistics`, absent de la réponse de login, et
 * retombait donc TOUJOURS sur un objet de zéros codés en dur — présenté à
 * l'administrateur comme une mesure. Les compteurs proviennent désormais des
 * mêmes sources que le tableau de bord (KLASSCI pour l'établissement, métriques
 * système pour le LMS), et ce dont aucune source n'existe vaut `null`
 * (« non mesuré ») au lieu d'un zéro fabriqué.
 */

/** Nombre fini, ou `null` si la valeur n'a pas été mesurée. */
const measured = (value) => (Number.isFinite(value) ? value : null)

/** Résout une promesse en tolérant l'échec : renvoie `null` et journalise. */
async function settle(promise, label) {
  try {
    return await promise
  } catch (error) {
    logError(error, `[useAdminStats] ${label}`)
    return null
  }
}

/** Les seize compteurs à `null` — état « rien n'a pu être mesuré ». */
const unmeasuredStats = () => ({
  nb_enseignants: null,
  nb_etudiants: null,
  nb_classes_actives: null,
  nb_matieres_actives: null,
  nb_filieres: null,
  nb_niveaux: null,
  nb_seances_actives: null,
  nb_visios_actives: null,
  nb_visios_scheduled: null,
  nb_evaluations: null,
  nb_evaluations_actives: null,
  nb_evaluations_terminees: null,
  nb_lessons: null,
  nb_forum_topics: null,
  nb_heures_cours: null,
  taux_presence: null,
})

export function useAdminStats() {
  const loading = ref(true)
  const error = ref(null)
  const stats = ref({})
  const meta = ref(null)

  /** Interroge les sources réelles et compose les compteurs. */
  async function fetchStats() {
    const [classes, matieres, enseignants, metrics] = await Promise.all([
      settle(klassciService.getClasses(), 'classes'),
      settle(klassciService.getMatieres(), 'matieres'),
      settle(klassciService.getEnseignants(), 'enseignants'),
      settle(analyticsService.getSystemMetrics(), 'métriques système'),
    ])

    // Aucune source n'a répondu : on ne compose rien, l'appelant lèvera l'erreur.
    if (classes === null && matieres === null && enseignants === null && metrics === null) {
      return null
    }

    return {
      ...unmeasuredStats(),

      // --- Établissement (KLASSCI) : dérivation PARTAGÉE avec le tableau de
      //     bord et le profil, pour que les trois écrans ne puissent plus
      //     diverger sur les mêmes compteurs. ---
      ...deriveInstitutionCounters({ classes, matieres, enseignants }),

      // --- LMS (métriques système) ---
      nb_lessons: measured(metrics?.lessons?.total),
      nb_evaluations: measured(metrics?.evaluations?.total),
      nb_evaluations_actives: measured(metrics?.evaluations?.published),

      // Laissés NON MESURÉS faute de source : séances actives, visioconférences,
      // évaluations terminées, sujets de forum, heures de cours et taux de
      // présence n'ont aujourd'hui aucun endpoint côté front. DETTE TRACÉE :
      // à brancher quand le backend les exposera. Afficher 0 serait un mensonge.
    }
  }

  async function loadStats() {
    loading.value = true
    error.value = null

    try {
      meta.value = auth.getMeta()

      const cached = readCache('admin_stats')
      if (cached?.data) {
        stats.value = cached.data
        meta.value = cached.metaData ?? meta.value
        loading.value = false
        refreshInBackground()
        return
      }

      const fresh = await fetchStats()
      if (fresh === null) {
        stats.value = unmeasuredStats()
        error.value = 'Impossible de charger les statistiques. Réessayez dans quelques instants.'
        return
      }

      stats.value = fresh
      writeCache('admin_stats', { data: stats.value, metaData: meta.value })
    } catch (err) {
      logError(err, '[useAdminStats] chargement')
      stats.value = unmeasuredStats()
      error.value = err.userMessage || 'Impossible de charger les statistiques'
    } finally {
      loading.value = false
    }
  }

  /**
   * Revalidation non bloquante : on garde l'affichage en cache si elle échoue.
   * L'ancienne version testait `user.admin_data.statistics`, condition jamais
   * vraie — le « rafraîchissement » ne rafraîchissait donc rien.
   */
  async function refreshInBackground() {
    const fresh = await fetchStats().catch((err) => {
      logError(err, '[useAdminStats] revalidation')
      return null
    })
    if (!fresh) return

    stats.value = fresh
    meta.value = auth.getMeta() ?? meta.value
    writeCache('admin_stats', { data: stats.value, metaData: meta.value })
  }

  function refreshData() {
    loadStats()
  }

  onMounted(() => {
    loadStats()
  })

  return {
    loading, error, stats, meta,
    loadStats, refreshInBackground, refreshData,
  }
}
