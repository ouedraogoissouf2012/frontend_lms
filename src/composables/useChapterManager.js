import { ref, watch, onMounted } from 'vue'
import api from '@/services/api'
import { toast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { normalizeError } from '@/services/errorHandler'
import knowledgeCheckService from '@/services/knowledgeCheck'
import { createEmptyChapter, buildChapterPayload } from '@/utils/chapterManager'

/**
 * Couche données de ChapterManager (#28 ; éclaté sous 300 lignes en H5).
 *
 * Reprend VERBATIM la logique de l'ancien god-component Options API : CRUD des
 * chapitres d'une leçon (`/lessons/:id/chapters`, `/chapters/:id`), upload de
 * média avec progression, et gestion des « knowledge checks » (quiz) par
 * chapitre (chargement, éditeur, lecteur). Le composant ne fait plus que câbler.
 *
 * @param {import('vue').Ref<number>} lessonId — id de la leçon (ref réactive).
 */
export function useChapterManager(lessonId) {
  const chapters = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const uploadingFile = ref(false)
  const uploadProgress = ref(0)
  const uploadStatus = ref('')
  const nextTempId = ref(1)
  // Knowledge Checks
  const knowledgeChecks = ref({})
  const showQuizEditor = ref(false)
  const showQuizPlayer = ref(false)
  const selectedChapterId = ref(null)
  const selectedQuiz = ref(null)
  const editingQuiz = ref(null)

  async function loadChapters() {
    loading.value = true
    try {
      const response = await api.get(`/lessons/${lessonId.value}/chapters`)
      if (response.success) {
        chapters.value = response.data.map(ch => ({
          ...ch,
          isEditing: false
        }))

        // Si aucun chapitre, créer automatiquement le premier
        if (chapters.value.length === 0) {
          addChapter()
        }
      }
    } catch (error) {
      console.error('[ChapterManager] Erreur chargement:', error)
    } finally {
      loading.value = false
    }
  }

  function addChapter() {
    chapters.value.push(createEmptyChapter(chapters.value.length, nextTempId.value++))
  }

  function editChapter(chapter) {
    chapter.isEditing = true
    chapter._originalState = { ...chapter }
  }

  function cancelEdit(chapter) {
    if (chapter.isNew) {
      const index = chapters.value.indexOf(chapter)
      chapters.value.splice(index, 1)
    } else {
      if (chapter._originalState) {
        Object.assign(chapter, chapter._originalState)
        delete chapter._originalState
      }
      chapter.isEditing = false
    }
  }

  async function saveChapter(chapter) {
    if (!chapter.title) {
      toast.warning('Le titre est obligatoire')
      return
    }

    saving.value = true
    try {
      const chapterData = buildChapterPayload(chapter)

      let response
      if (chapter.id) {
        response = await api.put(`/chapters/${chapter.id}`, chapterData)
      } else {
        response = await api.post(`/lessons/${lessonId.value}/chapters`, chapterData)
      }

      if (response.success) {
        if (chapter.selectedFile) {
          await uploadFile(response.data.id, chapter.selectedFile)
        }

        await loadChapters()
        toast.success(chapter.id ? 'Chapitre mis à jour!' : 'Chapitre créé!')
      }
    } catch (error) {
      console.error('[ChapterManager] Erreur sauvegarde:', error)
      toast.error(error.userMessage ?? normalizeError(error).userMessage)
    } finally {
      saving.value = false
    }
  }

  async function uploadFile(chapterId, file) {
    uploadingFile.value = true
    uploadProgress.value = 0
    uploadStatus.value = 'Upload du fichier...'

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post(`/chapters/${chapterId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      })

      if (response.success) {
        uploadStatus.value = 'Conversion en cours...'
        await new Promise(resolve => setTimeout(resolve, 2000))
        uploadStatus.value = 'Terminé!'
      }
    } catch (error) {
      console.error('[ChapterManager] Erreur upload:', error)
      toast.error(error.userMessage ?? normalizeError(error).userMessage)
    } finally {
      setTimeout(() => {
        uploadingFile.value = false
      }, 1000)
    }
  }

  async function deleteChapter(chapter) {
    if (!(await useConfirm().confirm({ message: `Supprimer le chapitre "${chapter.title}" ?`, variant: 'danger', confirmLabel: 'Supprimer' }))) {
      return
    }

    try {
      const response = await api.delete(`/chapters/${chapter.id}`)
      if (response.success) {
        await loadChapters()
        toast.success('Chapitre supprimé!')
      }
    } catch (error) {
      console.error('[ChapterManager] Erreur suppression:', error)
      toast.error(error.userMessage ?? normalizeError(error).userMessage)
    }
  }

  // =====================
  // Knowledge Checks
  // =====================
  async function loadKnowledgeChecks(chapterId) {
    try {
      const response = await knowledgeCheckService.getByChapter(chapterId)
      if (response.success) {
        knowledgeChecks.value[chapterId] = response.data
      }
    } catch (error) {
      console.error('[ChapterManager] Erreur chargement quiz:', error)
    }
  }

  async function loadAllKnowledgeChecks() {
    for (const chapter of chapters.value) {
      if (chapter.id) {
        await loadKnowledgeChecks(chapter.id)
      }
    }
  }

  function openQuizEditor(chapterId, quiz = null) {
    selectedChapterId.value = chapterId
    editingQuiz.value = quiz
    showQuizEditor.value = true
  }

  function closeQuizEditor() {
    showQuizEditor.value = false
    selectedChapterId.value = null
    editingQuiz.value = null
  }

  async function onQuizSaved(quiz) {
    // Recharger les quiz AVANT de fermer (pour garder selectedChapterId)
    if (quiz && quiz.chapter_id) {
      await loadKnowledgeChecks(quiz.chapter_id)
    }
    closeQuizEditor()
  }

  function openQuizPlayer(quiz) {
    selectedQuiz.value = quiz
    showQuizPlayer.value = true
  }

  function closeQuizPlayer() {
    showQuizPlayer.value = false
    selectedQuiz.value = null
  }

  async function onQuizCompleted(result) {
    console.log('[ChapterManager] Quiz complete:', result)
    // Recharger les quiz pour mettre a jour les scores
    if (selectedQuiz.value) {
      await loadKnowledgeChecks(selectedQuiz.value.chapter_id)
    }
  }

  async function deleteKnowledgeCheck(quiz) {
    if (!(await useConfirm().confirm({ message: `Supprimer le quiz "${quiz.title}" ?`, variant: 'danger', confirmLabel: 'Supprimer' }))) {
      return
    }

    try {
      const response = await knowledgeCheckService.delete(quiz.id)
      if (response.success) {
        await loadKnowledgeChecks(quiz.chapter_id)
        toast.success('Quiz supprime!')
      }
    } catch (error) {
      console.error('[ChapterManager] Erreur suppression quiz:', error)
      toast.error(error.userMessage ?? normalizeError(error).userMessage)
    }
  }

  // Retourne le premier quiz du chapitre (pour type quiz)
  function getChapterQuiz(chapterId) {
    const quizzes = knowledgeChecks.value[chapterId]
    return quizzes && quizzes.length > 0 ? quizzes[0] : null
  }

  watch(chapters, (newChapters) => {
    // Charger les quiz pour tous les chapitres
    newChapters.forEach(ch => {
      if (ch.id && !knowledgeChecks.value[ch.id]) {
        loadKnowledgeChecks(ch.id)
      }
    })
  }, { deep: true })

  onMounted(() => {
    loadChapters()
  })

  return {
    chapters, loading, saving, uploadingFile, uploadProgress, uploadStatus,
    knowledgeChecks, showQuizEditor, showQuizPlayer, selectedChapterId,
    selectedQuiz, editingQuiz,
    loadChapters, addChapter, editChapter, cancelEdit, saveChapter, uploadFile,
    deleteChapter, loadKnowledgeChecks, loadAllKnowledgeChecks, openQuizEditor,
    closeQuizEditor, onQuizSaved, openQuizPlayer, closeQuizPlayer, onQuizCompleted,
    deleteKnowledgeCheck, getChapterQuiz
  }
}
