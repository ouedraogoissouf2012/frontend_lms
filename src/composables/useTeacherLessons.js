import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { klassciService } from '@/services/klassci'
import lessonService from '@/services/lesson'
import { readCache, writeCache } from '@/services/cache'
import { useLessonForm } from '@/composables/useLessonForm'

/**
 * Couche données de TeacherLessons (#H4 ≤300) : charge leçons + matières (cache +
 * rafraîchissement arrière-plan), gère filtres/stats et la navigation. Le formulaire
 * de la modale est délégué à useLessonForm (partage la ref `lessons`).
 */
export function useTeacherLessons() {
  const router = useRouter()

  const lessons = ref([])
  const matieres = ref([])
  const loading = ref(false)
  const error = ref(null)

  const filters = reactive({
    matiere_id: '',
    status: '',
    type: ''
  })

  // Formulaire/modale délégué (partage la liste pour création/édition)
  const {
    showCreateModal,
    editingLesson,
    saving,
    lessonForm,
    saveLesson,
    closeModal
  } = useLessonForm(lessons)

  // Computed
  const filteredLessons = computed(() => {
    let filtered = lessons.value

    if (filters.matiere_id) {
      filtered = filtered.filter(l => l.matiere_id == filters.matiere_id)
    }
    if (filters.status) {
      filtered = filtered.filter(l => l.status === filters.status)
    }
    if (filters.type) {
      filtered = filtered.filter(l => l.type === filters.type)
    }

    return filtered
  })

  const stats = computed(() => {
    return {
      total: lessons.value.length,
      published: lessons.value.filter(l => l.status === 'published').length,
      draft: lessons.value.filter(l => l.status === 'draft').length,
      archived: lessons.value.filter(l => l.status === 'archived').length
    }
  })

  // Methods
  async function loadLessons() {
    // Vérifier le cache
    const cachedData = readCache('teacher_lessons')
    if (cachedData !== null) {
      console.log('[CACHE] Leçons chargées depuis le cache')
      lessons.value = cachedData
      loading.value = false
      refreshInBackground()
      return
    }

    loading.value = true
    error.value = null

    try {
      console.log('[LESSONS] Chargement des leçons via API...')
      const response = await lessonService.getLessons()

      console.log('[DEBUG] Response complète:', response)
      console.log('[DEBUG] response.success:', response.success)
      console.log('[DEBUG] response.data:', response.data)
      console.log('[DEBUG] response.data?.data:', response.data?.data)

      if (response && response.success && response.data) {
        // L'API retourne une structure paginée : response.data.data contient le tableau de leçons
        if (response.data.data && Array.isArray(response.data.data)) {
          lessons.value = response.data.data
          console.log('[OK] Leçons chargées depuis response.data.data:', lessons.value.length, 'leçons')
        } else if (Array.isArray(response.data)) {
          lessons.value = response.data
          console.log('[OK] Leçons chargées depuis response.data:', lessons.value.length, 'leçons')
        } else {
          lessons.value = []
          console.warn('[WARN] response.data existe mais n\'est pas un tableau')
        }
      } else {
        lessons.value = []
        console.warn('[WARN] Structure de réponse invalide')
        console.warn('[WARN] response:', response)
        console.warn('[WARN] response.success:', response?.success)
        console.warn('[WARN] response.data:', response?.data)
      }

      writeCache('teacher_lessons', lessons.value)
    } catch (err) {
      console.error('[ERREUR] Erreur chargement leçons:', err)
      error.value = 'Impossible de charger les leçons. Veuillez réessayer.'
      lessons.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadMatieres() {
    const cachedData = readCache('teacher_matieres')
    if (cachedData !== null) {
      matieres.value = cachedData
      return
    }

    try {
      // Utiliser getMatieres() au lieu de getTeacherDashboard() pour support coordinateur
      const matieresData = await klassciService.getMatieres()
      matieres.value = matieresData || []

      writeCache('teacher_matieres', matieres.value)
    } catch (err) {
      console.error('[ERREUR] Chargement matières:', err)
    }
  }

  async function refreshInBackground() {
    try {
      console.log('[BACKGROUND] Rafraîchissement leçons...')
      const response = await lessonService.getLessons()

      if (response && response.success) {
        lessons.value = response.data.data || response.data || []
        writeCache('teacher_lessons', lessons.value)
      }
    } catch (error) {
      console.warn('[BACKGROUND] Erreur rafraîchissement:', error)
    }
  }

  function applyFilters() {
    console.log('[FILTERS] Filtres appliqués:', filters)
  }

  function resetFilters() {
    filters.matiere_id = ''
    filters.status = ''
    filters.type = ''
  }

  function getStatusClass(status) {
    const classes = {
      published: 'status-published',
      draft: 'status-draft',
      archived: 'status-archived'
    }
    return classes[status] || 'status-draft'
  }

  function getStatusLabel(status) {
    const labels = {
      published: 'Publiée',
      draft: 'Brouillon',
      archived: 'Archivée'
    }
    return labels[status] || 'Brouillon'
  }

  function getMatiereLabel(matiereId) {
    const matiere = matieres.value.find(m => m.id == matiereId)
    return matiere ? (matiere.name || matiere.nom) : 'Matière inconnue'
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  function viewChapters(lesson) {
    router.push(`/teacher/lessons/${lesson.id}/chapters`)
  }

  onMounted(() => {
    loadMatieres()
    loadLessons()
  })

  return {
    lessons,
    matieres,
    loading,
    error,
    showCreateModal,
    editingLesson,
    saving,
    filters,
    lessonForm,
    filteredLessons,
    stats,
    loadLessons,
    loadMatieres,
    refreshInBackground,
    applyFilters,
    resetFilters,
    getStatusClass,
    getStatusLabel,
    getMatiereLabel,
    formatDate,
    viewChapters,
    saveLesson,
    closeModal
  }
}
