import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import lessonService from '@/services/lesson'
import chapterProgressService from '@/services/chapterProgress'
import api from '@/services/api'
import { toast } from '@/services/toast'

/**
 * Couche données de StudentLessonView (#H4 ≤300) : charge leçon + chapitres +
 * progression + quiz, gère le chapitre actif, la complétion (chapter_progress ET
 * lesson_progress, cf. #26) et le temps passé. Logique portée verbatim depuis la vue
 * Options API. NB : `showQuizPlayer` jamais lu dans le template = dette pré-existante.
 */
export function useStudentLessonView() {
  const route = useRoute()
  const router = useRouter()

  const lesson = ref(null)
  const chapters = ref([])
  const completedChapters = ref(new Set())
  const activeChapterIndex = ref(0)
  const sidebarCollapsed = ref(false)
  const loading = ref(true)
  const error = ref(null)
  const markingComplete = ref(false)
  const quizzes = ref({})
  const chapterStartTime = ref(null)
  const showQuizPlayer = ref(false)
  const contentAreaRef = ref(null)

  const lessonId = computed(() => parseInt(route.params.id))
  const activeChapter = computed(() => chapters.value[activeChapterIndex.value] || null)
  const chapterQuiz = computed(() => {
    if (!activeChapter.value) return null
    return quizzes.value[activeChapter.value.id] || null
  })
  const overallProgress = computed(() => {
    if (chapters.value.length === 0) return 0
    return Math.round((completedChapters.value.size / chapters.value.length) * 100)
  })

  watch(activeChapterIndex, () => {
    showQuizPlayer.value = false
    trackTimeSpent()
    chapterStartTime.value = Date.now()
    // Scroll to top of content
    nextTick(() => {
      if (contentAreaRef.value) contentAreaRef.value.scrollTop = 0
    })
  })

  async function loadAll() {
    loading.value = true
    error.value = null
    try {
      // Load lesson details
      const lessonRes = await lessonService.getLesson(lessonId.value)
      if (lessonRes.success) {
        lesson.value = lessonRes.data
      }

      // Load chapters
      const chaptersRes = await api.get(`/lessons/${lessonId.value}/chapters`)
      if (chaptersRes.success) {
        chapters.value = chaptersRes.data || []
      }

      // Load chapter progress
      try {
        const progressRes = await api.get(`/lessons/${lessonId.value}/chapter-progress`)
        if (progressRes.success && progressRes.data) {
          const list = progressRes.data.chapters || []
          const completedIds = list
            .filter(c => c.is_completed)
            .map(c => c.chapter_id)
          completedChapters.value = new Set(completedIds)
        }
      } catch (e) {
        // Progress endpoint might not exist yet — graceful fallback
        console.warn('[StudentLesson] Progress endpoint not available:', e.message)
      }

      // Load quizzes for quiz-type chapters
      const quizPromises = chapters.value
        .filter(ch => ch.content_type === 'quiz')
        .map(async (chapter) => {
          try {
            const quizRes = await api.get(`/knowledge-checks/chapter/${chapter.id}`)
            if (quizRes.success && quizRes.data) {
              quizzes.value[chapter.id] = quizRes.data
            }
          } catch (e) {
            // Quiz may not exist yet for this chapter — silent
          }
        })
      await Promise.all(quizPromises)
    } catch (err) {
      console.error('[StudentLesson] Load error:', err)
      // #26 : messages spécifiques portés depuis l'ex-vue /lessons/:id.
      if (err.response?.status === 403) {
        error.value = "Cette leçon n'est pas encore disponible"
      } else if (err.response?.status === 404) {
        error.value = 'Leçon introuvable'
      } else {
        error.value = 'Impossible de charger le cours. Veuillez réessayer.'
      }
    } finally {
      loading.value = false
    }
  }

  function setActiveChapter(index) {
    activeChapterIndex.value = index
    // On mobile, collapse sidebar after selection
    if (window.innerWidth < 768) {
      sidebarCollapsed.value = true
    }
  }

  function prevChapter() {
    if (activeChapterIndex.value > 0) {
      activeChapterIndex.value--
    }
  }

  function nextChapter() {
    if (activeChapterIndex.value < chapters.value.length - 1) {
      activeChapterIndex.value++
    }
  }

  function isChapterCompleted(chapterId) {
    return completedChapters.value.has(chapterId)
  }

  async function markChapterComplete() {
    if (!activeChapter.value) return
    markingComplete.value = true
    try {
      const timeSpent = Math.round((Date.now() - (chapterStartTime.value || Date.now())) / 1000)
      await chapterProgressService.markAsCompleted(activeChapter.value.id, timeSpent)
      completedChapters.value.add(activeChapter.value.id)
      // Force reactivity
      completedChapters.value = new Set(completedChapters.value)
      chapterStartTime.value = Date.now()

      // #26 : synchroniser la progression NIVEAU-LEÇON (table lesson_progress,
      // lue par la page matière / dashboard). Le backend a deux systèmes
      // distincts (chapter_progress vs lesson_progress) : l'ex-vue /lessons/:id
      // alimentait lesson_progress ; on préserve ce comportement ici.
      await syncLessonProgress()

      // Auto-advance to next chapter
      if (activeChapterIndex.value < chapters.value.length - 1) {
        setTimeout(() => {
          activeChapterIndex.value++
        }, 600)
      }
    } catch (err) {
      console.error('[StudentLesson] Mark complete error:', err)
      // #233 : NE PAS marquer le chapitre complété si le serveur a échoué. Sinon
      // l'UI affiche « terminé » alors que chapter_progress/lesson_progress n'ont
      // rien enregistré → progression faussée et désynchronisée au rechargement.
      // On informe l'étudiant (feedback non bloquant) pour qu'il réessaie.
      toast.error(
        err?.userMessage || 'La validation du chapitre a échoué. Veuillez réessayer.'
      )
    } finally {
      markingComplete.value = false
    }
  }

  /**
   * #26 : pont vers la progression niveau-leçon (table lesson_progress).
   * Le backend ne dérive PAS lesson_progress depuis chapter_progress ; cette
   * vue alimente donc les deux pour que la page matière/dashboard reste à jour.
   * Non bloquant : la progression chapitre reste la source fine de vérité.
   */
  async function syncLessonProgress() {
    try {
      const percentage = overallProgress.value
      const durationMinutes = lesson.value?.duration_minutes || 0
      if (percentage >= 100) {
        await lessonService.markComplete(lessonId.value)
      } else {
        await lessonService.updateProgress(lessonId.value, percentage, durationMinutes)
      }
    } catch (e) {
      console.warn('[StudentLesson] Sync progression leçon échouée:', e?.message)
    }
  }

  async function trackTimeSpent() {
    if (!activeChapter.value || !chapterStartTime.value) return
    const seconds = Math.round((Date.now() - chapterStartTime.value) / 1000)
    if (seconds > 5) {
      try {
        await chapterProgressService.updateTimeSpent(activeChapter.value.id, seconds)
      } catch (e) {
        // silent
      }
    }
  }

  async function onQuizCompleted(resultData) {
    // Mark the chapter as completed if the quiz was passed
    if (resultData && resultData.passed) {
      completedChapters.value.add(activeChapter.value.id)
      completedChapters.value = new Set(completedChapters.value)
    }
    // Refresh quiz data to get updated scores
    if (activeChapter.value) {
      try {
        const quizRes = await api.get(`/knowledge-checks/chapter/${activeChapter.value.id}`)
        if (quizRes.success && quizRes.data) {
          quizzes.value[activeChapter.value.id] = quizRes.data
          // Force reactivity
          quizzes.value = { ...quizzes.value }
        }
      } catch (e) {
        // silent
      }
    }
  }

  function onQuizClose() {
    // Nothing special needed — player resets to intro state internally
  }

  function goBack() {
    router.push({ name: 'student-courses' })
  }

  onMounted(() => {
    loadAll()
    chapterStartTime.value = Date.now()
    // Collapse sidebar on mobile
    if (window.innerWidth < 768) {
      sidebarCollapsed.value = true
    }
  })

  onBeforeUnmount(() => {
    trackTimeSpent()
  })

  return {
    lesson, chapters, completedChapters, activeChapterIndex, sidebarCollapsed,
    loading, error, markingComplete, quizzes, contentAreaRef,
    lessonId, activeChapter, chapterQuiz, overallProgress,
    loadAll, setActiveChapter, prevChapter, nextChapter, isChapterCompleted,
    markChapterComplete, onQuizCompleted, onQuizClose, goBack
  }
}
