import { ref, computed } from 'vue'
import { auth } from '@/services/api'
import { klassciService } from '@/services/klassci'
import { analyticsService } from '@/services/analytics'
import { logError } from '@/services/errorHandler'
import { deriveInstitutionCounters } from '@/utils/classStats'
import { useCachedResource } from '@/composables/useCachedResource'

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
 *
 * #224 : le schéma « lire-le-cache-puis-revalider » est désormais porté par
 * `useCachedResource` (stale-while-revalidate). L'écran affiche immédiatement les
 * derniers compteurs connus et revalide en arrière-plan, sans spinner bloquant.
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

/**
 * Interroge les sources réelles et compose les compteurs.
 * Rejette (avec `userMessage`) si AUCUNE source n'a répondu, pour que
 * `useCachedResource` renseigne `error` et conserve l'affichage précédent.
 */
async function fetchStats() {
  const [classes, matieres, enseignants, metrics] = await Promise.all([
    settle(klassciService.getClasses(), 'classes'),
    settle(klassciService.getMatieres(), 'matieres'),
    settle(klassciService.getEnseignants(), 'enseignants'),
    settle(analyticsService.getSystemMetrics(), 'métriques système'),
  ])

  // Aucune source n'a répondu : on ne compose rien, on signale l'échec.
  if (classes === null && matieres === null && enseignants === null && metrics === null) {
    const err = new Error('Toutes les sources de statistiques ont échoué')
    err.userMessage = 'Impossible de charger les statistiques. Réessayez dans quelques instants.'
    throw err
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

export function useAdminStats() {
  // La méta de session est locale (auth) et synchrone — hors du cache réseau.
  const meta = ref(auth.getMeta())

  const { data, loading, revalidating, error, load, refresh } =
    useCachedResource('admin_stats', fetchStats)

  // `data` reste `null` tant qu'aucune mesure n'a abouti (chargement froid ou
  // échec total) → on présente alors les seize compteurs NON MESURÉS, jamais des
  // zéros. En succès, `fetchStats` renvoie déjà les seize clés (nulls compris).
  const stats = computed(() => data.value ?? unmeasuredStats())

  function loadStats() {
    meta.value = auth.getMeta() ?? meta.value
    return load()
  }

  function refreshData() {
    meta.value = auth.getMeta() ?? meta.value
    return refresh()
  }

  return {
    loading, revalidating, error, stats, meta,
    loadStats, refreshData, refresh,
  }
}
