import { ref, computed, onMounted } from 'vue'
import { klassciService } from '@/services/klassci'
import { extractList } from '@/utils/apiList'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

/**
 * Couche données de StudentCourses (#G1 ≤300) : charge les cours de l'élève
 * (`GET /lessons/my-courses`, endpoint LOCAL malgré le nom du service), gère les
 * filtres matière/enseignant, la pagination, et la route de chaque cours.
 * La vue ne fait plus que câbler état + composants présentationnels.
 *
 * ## Pagination (#434)
 *
 * Le serveur pagine à 15 et décrit la sélection dans `meta`. `loadCourses`
 * (re)part de la page 1 et REMPLACE la liste ; `loadMore` demande la page
 * suivante et l'AJOUTE. Aucune page au-delà de `meta.last_page` n'est demandée.
 *
 * ## Réponses périmées (#437)
 *
 * Chaque requête reçoit un numéro (`requestSeq`). Seule la plus récente a le droit
 * d'écrire l'état : un filtre lent ne peut plus écraser un filtre choisi après lui,
 * ni la page 2 d'un ancien filtre se greffer sur la liste du nouveau. Annuler la
 * requête (AbortController) n'y suffirait pas : une réponse déjà en vol arrive quand
 * même.
 */
export function useStudentCourses() {
  const courses = ref([])
  const meta = ref(null)
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref(null)
  const loadMoreError = ref(null)
  // null = « tous » (#437) : une seule forme de valeur, les ids étant des entiers.
  const selectedMatiere = ref(null)
  const selectedEnseignant = ref(null)
  const availableFilters = ref({
    matieres: [],
    enseignants: [],
  })

  let requestSeq = 0

  // null = total non mesuré (avant toute réponse) : jamais un 0 fabriqué.
  const totalCount = computed(() => meta.value?.total ?? null)
  const hasMore = computed(() => !!meta.value && meta.value.current_page < meta.value.last_page)

  function activeFilters() {
    const filters = {}
    if (selectedMatiere.value) filters.matiere_id = selectedMatiere.value
    if (selectedEnseignant.value) filters.enseignant_id = selectedEnseignant.value
    return filters
  }

  async function loadCourses() {
    const seq = ++requestSeq
    loading.value = true
    error.value = null
    // Le compteur de l'ancienne sélection ne vaut plus : non mesuré jusqu'à la réponse.
    meta.value = null
    // Un « Charger plus » en vol devient périmé : son état ne doit pas lui survivre.
    loadingMore.value = false
    loadMoreError.value = null

    try {
      const filters = activeFilters()
      const response = await klassciService.getMyCourses(filters)
      if (seq !== requestSeq) return

      courses.value = extractList(response)
      meta.value = response.meta ?? null

      // Les filtres du serveur décrivent la sélection FILTRÉE : seule une réponse
      // sans filtre porte le dictionnaire complet du menu.
      if (!selectedMatiere.value && !selectedEnseignant.value && response.filters) {
        availableFilters.value = response.filters
      }
    } catch (err) {
      if (seq !== requestSeq) return
      console.error('[ERREUR] Erreur chargement cours:', err)
      // Le message de la cause (#436), préparé par l'intercepteur ou le service.
      error.value = err?.userMessage || ERROR_MESSAGES.unknown
    } finally {
      if (seq === requestSeq) loading.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value || loading.value) return
    const seq = ++requestSeq
    loadingMore.value = true
    loadMoreError.value = null

    try {
      const response = await klassciService.getMyCourses(activeFilters(), meta.value.current_page + 1)
      if (seq !== requestSeq) return

      // Filet tant que l'ordre serveur n'est pas départagé par id (lms_backend#937) :
      // un cours ne s'affiche jamais deux fois.
      const known = new Set(courses.value.map((course) => course.id))
      courses.value = [...courses.value, ...extractList(response).filter((course) => !known.has(course.id))]
      meta.value = response.meta ?? meta.value
    } catch (err) {
      if (seq !== requestSeq) return
      // La liste déjà chargée reste : l'échec ne concerne que la page suivante.
      loadMoreError.value = err?.userMessage || ERROR_MESSAGES.unknown
    } finally {
      if (seq === requestSeq) loadingMore.value = false
    }
  }

  function applyFilters() {
    loadCourses()
  }

  function resetFilters() {
    selectedMatiere.value = null
    selectedEnseignant.value = null
    loadCourses()
  }

  /**
   * Route d'un cours (#437) : la carte est un lien, elle reçoit sa destination
   * déjà résolue. `null` pour un cours sans id (défensif : le serveur en émet
   * toujours un) — la carte n'est alors pas cliquable.
   */
  function courseRoute(course) {
    return course?.id ? { name: 'lesson-details', params: { id: course.id } } : null
  }

  onMounted(() => loadCourses())

  return {
    courses,
    loading,
    error,
    selectedMatiere,
    selectedEnseignant,
    availableFilters,
    totalCount,
    hasMore,
    loadingMore,
    loadMoreError,
    loadCourses,
    loadMore,
    applyFilters,
    resetFilters,
    courseRoute,
  }
}
