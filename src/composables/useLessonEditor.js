import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from '@/services/toast'
import { normalizeError } from '@/services/errorHandler'
import lessonService from '@/services/lesson'
import chapterService from '@/services/chapter'
import { klassciService } from '@/services/klassci'

/**
 * Couche données de LessonEditor (#H4) : état du formulaire, chargement leçon/
 * matières/classes/chapitres, sauvegarde (création/édition), suppression et gestion
 * des ressources. Logique portée VERBATIM depuis la vue. La vue conserve son
 * template + CSS (choix utilisateur : pas d'éclatement des sections) et ne fait plus
 * que câbler ce composable.
 */
export function useLessonEditor() {
  const route = useRoute()
  const router = useRouter()

  const loading = ref(false)
  const saving = ref(false)

  const form = ref({
    title: '',
    description: '',
    content: '',
    type: 'cours',
    status: 'draft',
    matiere_id: null,
    classe_id: null,
    chapter_id: null,
    content_type: 'text',
    video_url: '',
    video_provider: 'youtube',
    pdf_url: '',
    audio_url: '',
    presentation_url: '',
    external_link: '',
    duration_minutes: null,
    resources: []
  })

  const chapters = ref([])
  const loadingChapters = ref(false)
  const matieres = ref([])
  const classes = ref([])

  const contentTypes = [
    { value: 'text', label: 'Texte', icon: '[T]' },
    { value: 'video', label: 'Vidéo', icon: '[V]' },
    { value: 'pdf', label: 'PDF', icon: '[P]' },
    { value: 'audio', label: 'Audio', icon: '(~)' },
    { value: 'presentation', label: 'Présentation', icon: '[S]' },
    { value: 'link', label: 'Lien', icon: '@' },
    { value: 'mixed', label: 'Mixte', icon: '[*]' }
  ]

  const videoProviders = [
    { value: 'youtube', label: 'YouTube', icon: '►' },
    { value: 'vimeo', label: 'Vimeo', icon: '▷' },
    { value: 'local', label: 'Fichier local', icon: '◄' },
    { value: 'other', label: 'Autre', icon: '○' }
  ]

  const isEditMode = computed(() => !!route.params.id)

  const loadLesson = async () => {
    if (!isEditMode.value) return

    try {
      loading.value = true
      const response = await lessonService.getLesson(route.params.id)

      if (response.success) {
        const lesson = response.data
        form.value = {
          title: lesson.title,
          description: lesson.description || '',
          content: lesson.content || '',
          type: lesson.type,
          status: lesson.status,
          matiere_id: lesson.matiere_id,
          classe_id: lesson.classe_id,
          chapter_id: lesson.chapter_id,
          content_type: lesson.content_type || 'text',
          video_url: lesson.video_url || '',
          video_provider: lesson.video_provider || 'youtube',
          pdf_url: lesson.pdf_url || '',
          audio_url: lesson.audio_url || '',
          presentation_url: lesson.presentation_url || '',
          external_link: lesson.external_link || '',
          duration_minutes: lesson.duration_minutes,
          resources: lesson.resources || []
        }
      }
    } catch (error) {
      console.error('[LessonEditor] Erreur loadLesson:', error)
      alert('Erreur lors du chargement de la leçon')
      router.go(-1)
    } finally {
      loading.value = false
    }
  }

  const saveLesson = async () => {
    console.log('[LessonEditor] saveLesson() démarré')
    console.log('[LessonEditor] Form data:', JSON.stringify(form.value, null, 2))

    try {
      saving.value = true
      console.log('[LessonEditor] saving = true')

      let response
      if (isEditMode.value) {
        console.log('[LessonEditor] Mode édition - ID:', route.params.id)
        response = await lessonService.updateLesson(route.params.id, form.value)
      } else {
        console.log('[LessonEditor] Mode création')
        response = await lessonService.createLesson(form.value)
      }

      console.log('[LessonEditor] Réponse API:', response)
      console.log('[LessonEditor] response.success:', response.success)
      console.log('[LessonEditor] response.data:', response.data)

      // L'API peut retourner soit response.success, soit response.data.success
      const success = response.success || (response.data && response.data.success)

      if (success) {
        console.log('[LessonEditor] Succès! Redirection vers /teacher/lessons')
        alert(isEditMode.value ? 'Leçon mise à jour avec succès !' : 'Leçon créée avec succès !')
        router.push('/teacher/lessons')
      } else {
        console.warn('[LessonEditor] Aucune indication de succès dans la réponse')
        console.warn('[LessonEditor] Structure complète:', JSON.stringify(response, null, 2))
        alert('La réponse de l\'API n\'indique pas de succès')
      }
    } catch (error) {
      console.error('[LessonEditor] Erreur saveLesson:', error)
      console.error('[LessonEditor] error.response:', error.response)
      toast.error(error.userMessage ?? normalizeError(error).userMessage)
    } finally {
      saving.value = false
      console.log('[LessonEditor] saving = false')
    }
  }

  const deleteLesson = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette leçon ? Cette action est irréversible.')) {
      return
    }

    try {
      saving.value = true
      const response = await lessonService.deleteLesson(route.params.id)

      if (response.success) {
        alert('Leçon supprimée avec succès')
        router.push('/teacher/lessons')
      }
    } catch (error) {
      console.error('[LessonEditor] Erreur deleteLesson:', error)
      toast.error(error.userMessage ?? normalizeError(error).userMessage)
    } finally {
      saving.value = false
    }
  }

  const loadChapters = async () => {
    try {
      loadingChapters.value = true
      const params = {}

      if (form.value.matiere_id) {
        params.matiere_id = form.value.matiere_id
      }

      const response = await chapterService.getChapters(params)

      if (response && response.success) {
        chapters.value = response.data || []
        console.log('[LessonEditor] Chapitres chargés:', chapters.value.length)
      }
    } catch (error) {
      console.error('[LessonEditor] Erreur loadChapters:', error)
    } finally {
      loadingChapters.value = false
    }
  }

  const addResource = () => {
    form.value.resources.push({
      title: '',
      description: '',
      type: 'pdf',
      url: '',
      order: form.value.resources.length
    })
  }

  const removeResource = (index) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette ressource ?')) {
      form.value.resources.splice(index, 1)
      form.value.resources.forEach((resource, idx) => {
        resource.order = idx
      })
    }
  }

  const loadMatieres = async () => {
    try {
      const data = await klassciService.getMatieres()
      matieres.value = data || []
      console.log('[LessonEditor] Matières chargées:', matieres.value.length)
    } catch (error) {
      console.error('[LessonEditor] Erreur loadMatieres:', error)
    }
  }

  const loadClasses = async () => {
    try {
      const data = await klassciService.getClasses()
      classes.value = data || []
      console.log('[LessonEditor] Classes chargées:', classes.value.length)
    } catch (error) {
      console.error('[LessonEditor] Erreur loadClasses:', error)
    }
  }

  onMounted(() => {
    loadMatieres()
    loadClasses()
    loadLesson()
    loadChapters()
  })

  return {
    loading,
    saving,
    form,
    chapters,
    loadingChapters,
    matieres,
    classes,
    contentTypes,
    videoProviders,
    isEditMode,
    saveLesson,
    deleteLesson,
    loadChapters,
    addResource,
    removeResource
  }
}
