import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import evaluationService from '@/services/evaluation'

/**
 * Couche données de PreviewEvaluation (H1 ≤300) : chargement de la
 * prévisualisation, simulation des réponses (sans enregistrement), progression,
 * et actions (édition, publication, retour). Services, routes, logs, confirm et
 * alertes strictement identiques à l'original.
 */
export function usePreviewEvaluation() {
  const router = useRouter()
  const route = useRoute()

  const loading = ref(true)
  const error = ref(null)
  const evaluation = ref(null)
  const previewAnswers = ref({})
  const publishing = ref(false)

  // Progression
  const answeredCount = computed(() => {
    return Object.keys(previewAnswers.value).filter(
      key => previewAnswers.value[key] !== undefined && previewAnswers.value[key] !== null && previewAnswers.value[key] !== ''
    ).length
  })

  const progressPercentage = computed(() => {
    if (!evaluation.value?.questions_count) return 0
    return (answeredCount.value / evaluation.value.questions_count) * 100
  })

  // Load preview
  async function loadPreview() {
    loading.value = true
    error.value = null

    try {
      const evaluationId = route.params.id
      const result = await evaluationService.previewEvaluation(evaluationId)

      if (result.success) {
        evaluation.value = result.data
        console.log('[PREVIEW] Évaluation chargée:', evaluation.value)
      } else {
        error.value = result.message || 'Erreur lors du chargement de la prévisualisation'
      }
    } catch (err) {
      console.error('[PREVIEW ERROR]', err)
      error.value = 'Impossible de charger la prévisualisation'
    } finally {
      loading.value = false
    }
  }

  // Sélectionner une réponse (simulation)
  function selectAnswer(questionId, answer) {
    previewAnswers.value[questionId] = answer
  }

  // Aller à l'édition
  function goToEdit() {
    router.push({
      name: 'EditQuestions',
      params: { id: evaluation.value.id }
    })
  }

  // Publier l'évaluation
  async function publishEvaluation() {
    if (!confirm('Voulez-vous publier cette évaluation maintenant ? Elle deviendra visible aux étudiants.')) {
      return
    }

    publishing.value = true
    try {
      const result = await evaluationService.publishEvaluation(evaluation.value.id)
      if (result.success) {
        alert('✅ Évaluation publiée avec succès !')
        router.push({ name: 'TeacherEvaluations' })
      } else {
        alert('❌ Erreur lors de la publication')
      }
    } catch (err) {
      console.error('[PUBLISH ERROR]', err)
      alert('❌ Erreur lors de la publication')
    } finally {
      publishing.value = false
    }
  }

  function goBack() {
    router.push({ name: 'TeacherEvaluations' })
  }

  onMounted(() => {
    loadPreview()
  })

  return {
    loading, error, evaluation, previewAnswers, publishing,
    answeredCount, progressPercentage,
    loadPreview, selectAnswer, goToEdit, publishEvaluation, goBack,
  }
}
