import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { klassciService } from '@/services/klassci'
import { toast } from '@/composables/useToast'
import { extractList } from '@/utils/apiList'

/**
 * Couche données de StudentCourses (#G1 ≤300) : charge les cours de l'élève via
 * KLASSCI, gère les filtres matière/enseignant et la navigation vers un cours.
 * La vue ne fait plus que câbler état + composants présentationnels.
 */
export function useStudentCourses() {
  const router = useRouter()

  const courses = ref([])
  const loading = ref(false)
  const error = ref(null)
  const selectedMatiere = ref('')
  const selectedEnseignant = ref('')
  const availableFilters = ref({
    matieres: [],
    enseignants: [],
  })

  async function loadCourses() {
    loading.value = true
    error.value = null

    try {
      const filters = {}
      if (selectedMatiere.value) filters.matiere_id = selectedMatiere.value
      if (selectedEnseignant.value) filters.enseignant_id = selectedEnseignant.value

      console.log('[COURSES] Chargement des cours avec filtres:', filters)
      const response = await klassciService.getMyCourses(filters)
      console.log('[OK] Cours chargés:', response)

      courses.value = extractList(response)

      // Sauvegarder les filtres disponibles (seulement si pas de filtre actif)
      if (!selectedMatiere.value && !selectedEnseignant.value && response.filters) {
        availableFilters.value = response.filters
      }

    } catch (err) {
      console.error('[ERREUR] Erreur chargement cours:', err)
      error.value = 'Impossible de charger vos cours. Veuillez réessayer.'
    } finally {
      loading.value = false
    }
  }

  function applyFilters() {
    loadCourses()
  }

  function resetFilters() {
    selectedMatiere.value = ''
    selectedEnseignant.value = ''
    loadCourses()
  }

  function navigateToCourse(course) {
    if (course.id) {
      console.log('[NAV] Navigation vers cours:', course.id)
      router.push({
        name: 'lesson-details',
        params: { id: course.id },
      })
    } else {
      console.error('[ERREUR] ID cours non trouvé:', course)
      toast.error('Impossible de naviguer vers ce cours')
    }
  }

  onMounted(() => loadCourses())

  return {
    courses,
    loading,
    error,
    selectedMatiere,
    selectedEnseignant,
    availableFilters,
    loadCourses,
    applyFilters,
    resetFilters,
    navigateToCourse,
  }
}
