import { ref, computed, onMounted } from 'vue'
import knowledgeCheckService from '@/services/knowledgeCheck'
import { toast } from '@/composables/useToast'

/**
 * Couche données de KnowledgeCheckEditor (#G6 ; éclaté sous 300 lignes en H5).
 *
 * Détient l'état du quiz en cours d'édition, sa validation globale, l'ajout /
 * suppression de questions et la sauvegarde (création ou mise à jour). La logique
 * propre à UNE question (options, type, bonne réponse) vit dans QuestionEditorCard
 * qui mute son objet `question` par référence — ici on ne gère que le quiz entier.
 *
 * @param {{ chapterId: number, existingQuiz: object|null }} props
 * @param {(e: string, payload?: any) => void} emit
 */
export function useKnowledgeCheckEditor(props, emit) {
  const saving = ref(false)
  const isEditing = computed(() => !!props.existingQuiz)

  const quiz = ref({
    chapter_id: props.chapterId,
    title: '',
    description: '',
    questions: [],
    passing_score: 70,
    max_attempts: null,
    shuffle_questions: false,
    shuffle_options: false,
    show_correct_answers: true,
    show_explanation: true,
    time_limit_minutes: null,
    position: 0,
    is_required: false // Quiz obligatoire pour passer au chapitre suivant
  })

  const isValid = computed(() => {
    if (!quiz.value.title.trim()) return false
    if (quiz.value.questions.length === 0) return false

    // Validate each question
    for (const q of quiz.value.questions) {
      if (!q.question.trim()) return false
      if (q.options.some(o => !o.trim())) return false
      if (q.type === 'multiple') {
        if (!Array.isArray(q.correct_answer) || q.correct_answer.length === 0) return false
      } else {
        if (q.correct_answer === null || q.correct_answer === undefined) return false
      }
    }

    return true
  })

  onMounted(() => {
    if (props.existingQuiz) {
      quiz.value = { ...props.existingQuiz }
    }
  })

  function addQuestion() {
    quiz.value.questions.push(knowledgeCheckService.createEmptyQuestion('single'))
  }

  function removeQuestion(index) {
    quiz.value.questions.splice(index, 1)
  }

  async function save() {
    if (!isValid.value || saving.value) return

    saving.value = true

    try {
      let response
      if (isEditing.value) {
        response = await knowledgeCheckService.update(props.existingQuiz.id, quiz.value)
      } else {
        response = await knowledgeCheckService.create(quiz.value)
      }

      emit('saved', response.data)
    } catch (error) {
      console.error('Erreur sauvegarde quiz:', error)
      toast.error('Erreur lors de la sauvegarde du quiz')
    } finally {
      saving.value = false
    }
  }

  return { saving, isEditing, quiz, isValid, addQuestion, removeQuestion, save }
}
