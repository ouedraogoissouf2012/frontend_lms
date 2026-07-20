import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/services/api'

/**
 * Couche données d'AdminEvaluationDetails (#H3 ≤300) : lit l'id d'évaluation dans
 * la route, charge les résultats par classe, expose statistiques/résultats et les
 * helpers de présentation (statut, note, dates) + l'export CSV. La vue ne câble plus.
 */
export function useAdminEvaluationDetails() {
  const router = useRouter()
  const route = useRoute()

  // State
  const loading = ref(true)
  const error = ref(null)
  const evaluation = ref(null)
  const resultats = ref([])
  const statistiques = ref(null)

  function unwrapData(response) {
    return response?.data?.data || response?.data || response || null
  }

  function buildEmptyStatistiques(evaluationData = {}) {
    const soumis = getSubmissionsCount(evaluationData)
    const total = firstNumber([
      evaluationData.classe?.places_occupees,
      evaluationData.classe?.nb_etudiants,
      evaluationData.total_etudiants,
      soumis
    ])

    return {
      total_etudiants: total,
      etudiants_soumis: soumis,
      etudiants_en_cours: 0,
      etudiants_non_passes: Math.max(total - soumis, 0),
      moyenne_classe: null,
      taux_participation: total > 0 ? Math.round((soumis / total) * 100) : 0,
      note_min: null,
      note_max: null,
      mediane: null,
    }
  }

  function getSubmissionsCount(evaluationData = {}) {
    const count = Number(evaluationData.submissions_count)
    if (Number.isFinite(count)) return count
    if (Array.isArray(evaluationData.submissions)) return evaluationData.submissions.length
    return 0
  }

  function firstNumber(values) {
    for (const value of values) {
      const number = Number(value)
      if (Number.isFinite(number)) return number
    }
    return 0
  }

  function applyEvaluationOnly(evaluationData) {
    evaluation.value = evaluationData
    resultats.value = []
    statistiques.value = buildEmptyStatistiques(evaluationData)
    error.value = null
  }

  function applyResultsPayload(payload) {
    evaluation.value = payload?.evaluation || null
    resultats.value = Array.isArray(payload?.resultats) ? payload.resultats : []
    statistiques.value = payload?.statistiques || buildEmptyStatistiques(evaluation.value)
  }

  async function loadEvaluationFallback(evaluationId, initialError) {
    try {
      const fallbackResponse = await api.get(`/evaluations/${evaluationId}`)
      const evaluationData = unwrapData(fallbackResponse)

      applyEvaluationOnly(evaluationData)

      console.warn(
        '[AdminEvaluationDetails] Résultats détaillés indisponibles, affichage de l’évaluation seule:',
        initialError
      )
    } catch (fallbackError) {
      console.error('Erreur chargement évaluation fallback:', fallbackError)
      error.value = initialError?.userMessage
        || initialError?.response?.data?.message
        || 'Erreur lors du chargement des résultats'
    }
  }

  // Methods
  const loadData = async () => {
    loading.value = true
    error.value = null

    try {
      const evaluationId = route.params.id
      const evaluationResponse = await api.get(`/evaluations/${evaluationId}`)
      const evaluationData = unwrapData(evaluationResponse)

      if (evaluationResponse?.success === false || !evaluationData) {
        error.value = evaluationResponse?.message || 'Erreur lors du chargement de l’évaluation'
        return
      }

      if (getSubmissionsCount(evaluationData) === 0) {
        applyEvaluationOnly(evaluationData)
        return
      }

      const response = await api.get(`/evaluations/${evaluationId}/results-by-class`)

      // L'intercepteur retourne déjà response.data, donc response = { success: true, data: {...} }
      if (response.success) {
        applyResultsPayload(unwrapData(response))
      } else {
        error.value = response.message || 'Erreur lors du chargement des résultats'
      }
    } catch (err) {
      console.error('Erreur chargement résultats:', err)
      await loadEvaluationFallback(route.params.id, err)
    } finally {
      loading.value = false
    }
  }

  const goBack = () => {
    router.back()
  }

  const getStatusClass = (status) => {
    const classes = {
      'soumis': 'status-success',
      'corrige': 'status-success',
      'en_cours': 'status-warning',
      'non_passee': 'status-error'
    }
    return classes[status] || 'status-default'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'soumis': 'Soumis',
      'corrige': 'Corrigé',
      'en_cours': 'En cours',
      'non_passee': 'Non passée'
    }
    return labels[status] || status
  }

  const getNoteClass = (note) => {
    if (note === null || note === undefined) return ''
    if (note >= 16) return 'note-excellent'
    if (note >= 14) return 'note-good'
    if (note >= 10) return 'note-average'
    return 'note-poor'
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateTime = (datetime) => {
    if (!datetime) return '-'
    return new Date(datetime).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const exportCSV = () => {
    const csvContent = [
      ['#', 'Nom complet', 'Statut', 'Note /20', 'Score', 'Date soumission', 'Tentative'],
      ...resultats.value.map((r, i) => [
        i + 1,
        r.etudiant_nom_complet,
        getStatusLabel(r.status),
        r.note !== null && r.note !== undefined ? r.note.toFixed(2) : '-',
        r.score || '-',
        formatDateTime(r.submitted_at),
        r.attempt || '-'
      ])
    ].map(row => row.join(';')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `resultats_${evaluation.value?.titre || 'evaluation'}_${new Date().getTime()}.csv`
    link.click()
  }

  onMounted(() => {
    loadData()
  })

  return {
    loading, error, evaluation, resultats, statistiques,
    loadData, goBack,
    getStatusClass, getStatusLabel, getNoteClass,
    formatDate, formatDateTime, exportCSV,
  }
}
