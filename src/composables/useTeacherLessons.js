import { ref, reactive, computed, onMounted } from 'vue'
import { formatDateLong } from '@/utils/formatters'
import { useRouter } from 'vue-router'
import { klassciService } from '@/services/klassci'
import lessonService from '@/services/lesson'
import { readCache, writeCache } from '@/services/cache'
import { useLessonForm } from '@/composables/useLessonForm'
import { extractList } from '@/utils/apiList'

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
      lessons.value = extractList(response)
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
      matieres.value = extractList(matieresData, ['matieres'])
      if (matieres.value.length > 0 || Array.isArray(matieresData) || Array.isArray(matieresData?.matieres)) {
        writeCache('teacher_matieres', matieres.value)
      }
    } catch (err) {
      console.error('[ERREUR] Chargement matières:', err)
    }
  }

  async function refreshInBackground() {
    try {
      console.log('[BACKGROUND] Rafraîchissement leçons...')
      const response = await lessonService.getLessons()

      if (response && response.success) {
        lessons.value = extractList(response)
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

  // #283 : délègue au formatter canonique (repli local conservé).
  function formatDate(dateString) {
    return formatDateLong(dateString, { fallback: 'N/A' })
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
