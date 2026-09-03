import { computed } from 'vue'
import { klassciService } from '@/services/klassci'
import { logError } from '@/services/errorHandler'
import { enrichTeacherClasses } from '@/utils/classStats'
import { mergeClassMeasures } from '@/utils/classMeasures'
import { useCachedResource } from '@/composables/useCachedResource'

const TEACHER_CLASSES_CACHE_KEY = 'teacher_classes_dashboard_v2'

/**
 * Charge les classes de l'enseignant AVEC leurs effectifs.
 *
 * Deux sources, en parallele : le tableau de bord dit QUELLES classes sont les
 * siennes, mais ne porte ni effectif ni capacite ; `/proxy/classes` les porte,
 * pour tout l'etablissement et en UN appel. Interroger chaque classe couterait
 * un aller-retour par carte affichee.
 *
 * L'echec du referentiel n'est pas fatal : les mesures restent `null` (rendues
 * « — »), plutot qu'un chiffre invente ou un ecran vide. En revanche l'echec du
 * tableau de bord est fatal (aucune classe a montrer) : on rejette avec un
 * `userMessage`, et `useCachedResource` renseigne `error` en conservant l'affichage.
 */
async function fetchClasses() {
  const [dashboardOutcome, referentielOutcome] = await Promise.allSettled([
    klassciService.getTeacherDashboard(),
    klassciService.getClasses(),
  ])

  if (dashboardOutcome.status === 'rejected') {
    const err = dashboardOutcome.reason ?? new Error('Tableau de bord enseignant indisponible')
    err.userMessage = err.userMessage || 'Impossible de charger vos classes. Veuillez réessayer.'
    throw err
  }

  const dashboard = dashboardOutcome.value
  const rawClasses = Array.isArray(dashboard?.classes) ? dashboard.classes : []
  const dashboardMatieres = Array.isArray(dashboard?.matieres) ? dashboard.matieres : []
  const referentiel = referentielOutcome.status === 'fulfilled' ? referentielOutcome.value : null

  if (referentielOutcome.status === 'rejected') {
    logError(referentielOutcome.reason, '[useTeacherClasses] effectifs')
  }

  return enrichTeacherClasses(mergeClassMeasures(rawClasses, referentiel), dashboardMatieres)
}

/**
 * Couche donnees de TeacherClasses (#H9 ≤300). Charge les classes de
 * l'enseignant, les enrichit (effectifs, nb matieres) et gere cache +
 * rafraichissement en arriere-plan. La vue ne fait plus que cabler.
 *
 * #224 : le schema « lire-le-cache-puis-rafraichir-en-arriere-plan » est
 * desormais porte par `useCachedResource` (stale-while-revalidate).
 */
export function useTeacherClasses() {
  const { data, loading, error, load } = useCachedResource(TEACHER_CLASSES_CACHE_KEY, fetchClasses)

  const classes = computed(() => data.value ?? [])

  function loadClasses() {
    return load()
  }

  return { classes, loading, error, loadClasses }
}
