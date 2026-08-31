import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import evaluationService from '@/services/evaluation'
import { formatDateTime, getStatusLabel } from '@/utils/evaluationCorrectionsFormat'
import { toast } from '@/composables/useToast'

/**
 * Couche données de EvaluationCorrections (H2 ≤300) : charge les résultats d'une
 * évaluation par classe (évaluation + résultats + statistiques), gère le retour
 * et l'export CSV. La logique de présentation pure vit dans
 * `utils/evaluationCorrectionsFormat`. La vue ne fait que câbler.
 */
export function useEvaluationCorrections() {
  const router = useRouter()
  const route = useRoute()

  const loading = ref(true)
  const error = ref(null)
  const evaluation = ref(null)
  const resultats = ref([])
  const statistiques = ref({
    total_etudiants: 0,
    etudiants_soumis: 0,
    etudiants_en_cours: 0,
    etudiants_non_passes: 0,
    taux_participation: 0,
    moyenne_classe: null,
    note_max: null,
    note_min: null
  })

  // Charger les résultats
  async function loadResults() {
    loading.value = true
    error.value = null

    try {
      const evaluationId = parseInt(route.params.id)
      console.log('[NOTES] Chargement résultats pour évaluation:', evaluationId)

      const response = await evaluationService.getResultsByClass(evaluationId)

      if (response.success) {
        evaluation.value = response.data.evaluation
        resultats.value = response.data.resultats
        statistiques.value = response.data.statistiques

        console.log('[NOTES] Résultats chargés:', {
          evaluation: evaluation.value.titre,
          total_etudiants: statistiques.value.total_etudiants,
          soumis: statistiques.value.etudiants_soumis,
          moyenne: statistiques.value.moyenne_classe
        })
      } else {
        error.value = 'Impossible de charger les résultats'
      }
    } catch (err) {
      console.error('[ERREUR] Chargement résultats:', err)
      error.value = err.response?.data?.message || 'Erreur lors du chargement des résultats'
    } finally {
      loading.value = false
    }
  }

  // Retour
  function goBack() {
    router.push({ name: 'TeacherEvaluations' })
  }

  // Export to Excel
  function exportToExcel() {
    if (!evaluation.value || resultats.value.length === 0) {
      toast.warning('Aucune donnée à exporter')
      return
    }

    // Créer les données CSV
    const headers = ['Nom', 'Prénom', 'Note (/20)', 'Statut', 'Date soumission', 'Tentative']
    const rows = resultats.value.map(r => [
      r.etudiant_nom || '',
      r.etudiant_prenom || '',
      r.note !== null ? r.note : '',
      getStatusLabel(r.status),
      r.submitted_at ? formatDateTime(r.submitted_at) : '',
      r.attempt || ''
    ])

    let csvContent = headers.join(',') + '\n'
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n'
    })

    // Télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `notes_${evaluation.value.titre.replace(/[^a-z0-9]/gi, '_')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  onMounted(() => {
    loadResults()
  })

  return {
    loading, error, evaluation, resultats, statistiques,
    loadResults, goBack, exportToExcel,
  }
}
