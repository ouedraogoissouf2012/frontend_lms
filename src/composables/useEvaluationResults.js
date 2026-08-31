import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { endpoints } from '@/services/endpoints'

const CORRECTION_DELAY_DAYS = 7 // Délai en jours avant d'afficher les bonnes réponses

/**
 * Couche données de EvaluationResults (H2 ≤300) : charge la soumission de
 * l'étudiant pour une évaluation et dérive l'état de correction (disponibilité,
 * compte à rebours, progression, date d'ouverture). La vue ne fait que câbler.
 */
export function useEvaluationResults() {
  const route = useRoute()

  const submission = ref(null)
  const loading = ref(true)
  const error = ref(null)

  // Utiliser la valeur de l'API (sécurisée côté backend) ou fallback calcul local
  const isCorrectionAvailable = computed(() => {
    // Priorité à la valeur de l'API (source de vérité)
    if (submission.value && typeof submission.value.correction_available === 'boolean') {
      return submission.value.correction_available
    }

    // Fallback: calcul local (pour compatibilité)
    if (!submission.value || !submission.value.submitted_at) return false

    const submittedDate = new Date(submission.value.submitted_at)
    const now = new Date()
    const daysSinceSubmission = Math.floor((now - submittedDate) / (1000 * 60 * 60 * 24))

    return daysSinceSubmission >= CORRECTION_DELAY_DAYS
  })

  // Nombre de jours restants avant correction
  const daysUntilCorrection = computed(() => {
    // Si l'API fournit correction_available_at, l'utiliser
    if (submission.value && submission.value.correction_available_at) {
      const correctionDate = new Date(submission.value.correction_available_at)
      const now = new Date()
      const daysRemaining = Math.ceil((correctionDate - now) / (1000 * 60 * 60 * 24))
      return Math.max(0, daysRemaining)
    }

    // Fallback: calcul local
    if (!submission.value || !submission.value.submitted_at) return 0

    const submittedDate = new Date(submission.value.submitted_at)
    const now = new Date()
    const daysSinceSubmission = Math.floor((now - submittedDate) / (1000 * 60 * 60 * 24))

    return Math.max(0, CORRECTION_DELAY_DAYS - daysSinceSubmission)
  })

  // Pourcentage de progression vers la correction
  const correctionProgressPercent = computed(() => {
    if (!submission.value || !submission.value.submitted_at) return 0

    const delayDays = submission.value.correction_delay_days || CORRECTION_DELAY_DAYS
    const submittedDate = new Date(submission.value.submitted_at)
    const now = new Date()
    const daysSinceSubmission = Math.floor((now - submittedDate) / (1000 * 60 * 60 * 24))

    const percent = Math.min(100, Math.floor((daysSinceSubmission / delayDays) * 100))
    return percent
  })

  // Date à laquelle la correction sera disponible
  const formatCorrectionDate = computed(() => {
    // Utiliser la date de l'API si disponible
    if (submission.value && submission.value.correction_available_at) {
      const correctionDate = new Date(submission.value.correction_available_at)
      return correctionDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Fallback: calcul local
    if (!submission.value || !submission.value.submitted_at) return ''

    const delayDays = submission.value.correction_delay_days || CORRECTION_DELAY_DAYS
    const submittedDate = new Date(submission.value.submitted_at)
    const correctionDate = new Date(submittedDate)
    correctionDate.setDate(correctionDate.getDate() + delayDays)

    return correctionDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  })

  async function loadResults() {
    try {
      const evaluationId = route.params.id
      const result = await api.get(endpoints.evaluations.mySubmission(evaluationId))

      if (result.success) {
        submission.value = result.data
      } else {
        error.value = result.message || 'Résultats non disponibles'
      }
    } catch (err) {
      console.error('Erreur chargement résultats:', err)
      error.value = 'Impossible de charger vos résultats'
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    loadResults()
  })

  return {
    submission, loading, error,
    isCorrectionAvailable, daysUntilCorrection, correctionProgressPercent, formatCorrectionDate,
    loadResults,
  }
}
