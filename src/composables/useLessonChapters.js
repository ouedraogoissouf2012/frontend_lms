import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from '@/services/toast'
import { useConfirm } from '@/composables/useConfirm'
import { normalizeError } from '@/services/errorHandler'
import lessonService from '@/services/lesson'

/**
 * Couche données de LessonChapters (#H4 ≤300) : charge la leçon depuis la route,
 * gère l'état (chargement/erreur/publication), la prévisualisation, la publication
 * et la navigation. La vue ne fait plus que câbler le composable + ChapterManager.
 */
export function useLessonChapters() {
  // Pont route/router double source : inst.proxy.$route (tests de vue via
  // global.mocks.$route + prod) avec repli sur useRoute() (tests de composable qui
  // mockent vue-router). Réactif en prod ; comportement identique. Voir specs decomposition-300.
  const inst = getCurrentInstance()
  const injectedRoute = useRoute()
  const injectedRouter = useRouter()
  const route = computed(() => inst?.proxy?.$route ?? injectedRoute)
  const router = inst?.proxy?.$router ?? injectedRouter

  const lesson = ref(null)
  const loadingLesson = ref(false)
  const error = ref(null)
  const publishing = ref(false)

  const lessonId = computed(() => parseInt(route.value?.params?.id))
  // Mode lecture seule uniquement si explicitement demande avec ?readonly=true
  const isReadOnly = computed(() => route.value?.query?.readonly === 'true')

  async function loadLesson() {
    loadingLesson.value = true
    error.value = null

    try {
      const response = await lessonService.getLesson(lessonId.value)
      if (response.success) {
        lesson.value = response.data
      }
    } catch (err) {
      console.error('[LessonChapters] Erreur chargement leçon:', err)
      error.value = err.response?.data?.message || 'Erreur lors du chargement de la leçon'
    } finally {
      loadingLesson.value = false
    }
  }

  function previewLesson() {
    // Ouvrir la prévisualisation dans un nouvel onglet
    const previewUrl = router.resolve({
      name: 'LessonView',
      params: { id: lessonId.value }
    }).href
    window.open(previewUrl, '_blank')
  }

  async function publishLesson() {
    if (!(await useConfirm().confirm({ message: 'Publier cette leçon ? Elle sera visible par les étudiants.' }))) {
      return
    }

    publishing.value = true
    try {
      const response = await lessonService.publishLesson(lessonId.value)
      if (response.success) {
        toast.success('Leçon publiée avec succès!')

        // Rediriger vers la page de la matière
        if (lesson.value?.matiere_id) {
          router.push({
            name: 'matiere-details',
            params: { id: lesson.value.matiere_id }
          })
        } else {
          await loadLesson()
        }
      }
    } catch (err) {
      console.error('[LessonChapters] Erreur publication:', err)
      toast.error(err.userMessage ?? normalizeError(err).userMessage)
    } finally {
      publishing.value = false
    }
  }

  function onChaptersUpdated() {
    // Callback quand les chapitres sont mis à jour
    console.log('[LessonChapters] Chapitres mis à jour')
  }

  function goBack() {
    // Retourner à la page de la matière si possible
    if (lesson.value?.matiere_id) {
      router.push({
        name: 'matiere-details',
        params: { id: lesson.value.matiere_id }
      })
    } else {
      router.back()
    }
  }

  onMounted(() => { loadLesson() })

  return {
    lesson,
    loadingLesson,
    error,
    publishing,
    lessonId,
    isReadOnly,
    loadLesson,
    previewLesson,
    publishLesson,
    onChaptersUpdated,
    goBack
  }
}
