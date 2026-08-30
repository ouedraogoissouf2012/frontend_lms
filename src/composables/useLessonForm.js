import { ref, reactive } from 'vue'
import { writeCache } from '@/services/cache'
import lessonService from '@/services/lesson'
import { toast } from '@/services/toast'

/**
 * Couche formulaire de la modale leçon (#H4 ≤300), extraite de TeacherLessons.
 * Reçoit la ref `lessons` (injection) pour persister création/édition + cache.
 * NB : modale sans déclencheur dans la vue + fonctions editLesson/deleteLesson
 * commentées = dettes pré-existantes conservées à l'identique.
 */
export function useLessonForm(lessons) {
  const showCreateModal = ref(false)
  const editingLesson = ref(null)
  const saving = ref(false)

  const lessonForm = reactive({
    matiere_id: '',
    title: '',
    description: '',
    type: 'document',
    status: 'draft'
  })

  // Fonction edit désactivée - Modification uniquement depuis Matières
  // function editLesson(lesson) {
  //   router.push(`/teacher/lessons/${lesson.id}/edit`)
  // }

  // Fonction delete désactivée - Suppression uniquement depuis Matières
  // async function deleteLesson(lesson) {
  //   if (!confirm(`Êtes-vous sûr de vouloir supprimer la leçon "${lesson.title || lesson.titre}" ?`)) {
  //     return
  //   }
  //
  //   try {
  //     const response = await lessonService.deleteLesson(lesson.id)
  //     if (response && response.success) {
  //       lessons.value = lessons.value.filter(l => l.id !== lesson.id)
  //       console.log('[OK] Leçon supprimée')
  //
  //       // Mettre à jour le cache
  //       localStorage.setItem(CACHE_KEY_LESSONS, JSON.stringify({
  //         data: lessons.value,
  //         timestamp: Date.now()
  //       }))
  //     }
  //   } catch (err) {
  //     console.error('[ERREUR] Suppression leçon:', err)
  //     alert('Erreur lors de la suppression: ' + (err.response?.data?.message || err.message))
  //   }
  // }

  async function saveLesson() {
    if (!lessonForm.matiere_id || !lessonForm.title) {
      toast.warning('La matière et le titre sont obligatoires')
      return
    }

    saving.value = true

    try {
      if (editingLesson.value) {
        // #236 : vraie mise à jour serveur (plus de mutation purement locale).
        const response = await lessonService.updateLesson(editingLesson.value.id, { ...lessonForm })
        if (!response?.success) {
          toast.error('Erreur lors de la sauvegarde : ' + (response?.message || 'réessayez.'))
          return
        }
        const index = lessons.value.findIndex(l => l.id === editingLesson.value.id)
        if (index !== -1) {
          lessons.value[index] = { ...lessons.value[index], ...(response.data || lessonForm) }
        }
      } else {
        // #236 : vraie création serveur — on insère la leçon RENVOYÉE (id réel).
        // Avant : leçon fabriquée (id: Date.now()) jamais persistée, mais écrite
        // dans le cache lu par useTeacherLessons → « leçon fantôme ».
        const response = await lessonService.createLesson({ ...lessonForm })
        if (!response?.success || !response.data) {
          toast.error('Erreur lors de la sauvegarde : ' + (response?.message || 'réessayez.'))
          return
        }
        lessons.value.unshift(response.data)
      }

      // Rafraîchir le cache avec l'état réellement persisté.
      writeCache('teacher_lessons', lessons.value)
      closeModal()
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde : ' + (err?.userMessage || 'réessayez.'))
    } finally {
      saving.value = false
    }
  }

  function closeModal() {
    showCreateModal.value = false
    editingLesson.value = null
    lessonForm.matiere_id = ''
    lessonForm.title = ''
    lessonForm.description = ''
    lessonForm.type = 'document'
    lessonForm.status = 'draft'
  }

  return {
    showCreateModal,
    editingLesson,
    saving,
    lessonForm,
    saveLesson,
    closeModal
  }
}
