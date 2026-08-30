import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import evaluationService from '@/services/evaluation'
import { toast } from '@/services/toast'
import { useConfirm } from '@/composables/useConfirm'

/**
 * Actions enseignant de TeacherEvaluations (H1 ≤300). Complète le composable de
 * données `useTeacherEvaluations` (déjà mergé) en encapsulant l'état de la modale
 * de création de version en ligne et les handlers d'actions (créer/éditer/voir
 * résultats/synchroniser/publier/prévisualiser/supprimer). Reçoit en paramètres
 * les refs de données partagées (`evaluationsLMS`, `loadEvaluationsLMS`) afin de
 * NE PAS modifier le composable de données existant. Services, routes, payloads,
 * textes, alert/confirm/console strictement identiques à l'original.
 */
export function useTeacherEvaluationActions({ evaluationsLMS, loadEvaluationsLMS }) {
  const router = useRouter()

  // État UI local aux actions (modale de création de version en ligne)
  const syncing = ref(null)
  const showCreateModal = ref(false)
  const selectedEvaluation = ref(null)
  const creating = ref(false)
  const onlineForm = reactive({
    type: 'qcm',
    duree_minutes: 60,
    description: ''
  })

  // Create online version
  function createOnlineVersion(evaluation) {
    selectedEvaluation.value = evaluation
    onlineForm.type = 'qcm'
    onlineForm.duree_minutes = 60
    onlineForm.description = ''
    showCreateModal.value = true
  }

  // Close modal
  function closeCreateModal() {
    showCreateModal.value = false
    selectedEvaluation.value = null
    onlineForm.type = 'qcm'
    onlineForm.duree_minutes = 60
    onlineForm.description = ''
  }

  // Submit create online version
  async function submitCreateOnlineVersion() {
    if (!selectedEvaluation.value) return

    // Vérifier côté frontend qu'une version en ligne n'existe pas déjà
    const alreadyExists = evaluationsLMS.value.some(
      e => e.klassci_evaluation_id === selectedEvaluation.value.id
    )
    if (alreadyExists) {
      toast.error('Une version en ligne existe déjà pour cette évaluation.')
      closeCreateModal()
      return
    }

    creating.value = true
    try {
      const newEvaluation = {
        klassci_evaluation_id: selectedEvaluation.value.id,
        klassci_matiere_id: selectedEvaluation.value.matiere?.id,
        klassci_classe_id: selectedEvaluation.value.classe?.id,
        titre: selectedEvaluation.value.titre,
        description: onlineForm.description || selectedEvaluation.value.description || '',
        type: onlineForm.type,
        date_evaluation: selectedEvaluation.value.programmation?.date_evaluation || selectedEvaluation.value.date_evaluation,
        duree_minutes: onlineForm.duree_minutes,
        coefficient: selectedEvaluation.value.programmation?.coefficient || selectedEvaluation.value.coefficient || 1,
        bareme: selectedEvaluation.value.programmation?.bareme || selectedEvaluation.value.bareme || 20,
        questions: []
      }

      console.log('[CREATE] Création évaluation LMS:', newEvaluation)
      const result = await evaluationService.createEvaluation(newEvaluation)

      if (result.success) {
        console.log('[SUCCESS] Évaluation créée:', result.data)
        toast.success('Version en ligne créée! Vous pouvez maintenant ajouter des questions.')

        // Reload evaluations
        await loadEvaluationsLMS()

        // Close modal
        closeCreateModal()

        // TODO: Rediriger vers page d'édition des questions
        // router.push({ name: 'EditQuestions', params: { id: result.data.id } })
      }
    } catch (err) {
      console.error('[ERREUR] Création évaluation:', err)
      if (err.response?.status === 409) {
        toast.error('Une version en ligne existe déjà pour cette évaluation.')
        await loadEvaluationsLMS()
        closeCreateModal()
      } else {
        toast.error('Erreur lors de la création de la version en ligne')
      }
    } finally {
      creating.value = false
    }
  }

  // Edit online version
  function editOnlineVersion(evaluation) {
    if (!evaluation.online_version) return

    router.push({
      name: 'EditQuestions',
      params: { id: evaluation.online_version.id },
      query: {
        klassci_id: evaluation.id
      }
    })
  }

  // View results
  function viewResults(evaluation) {
    if (!evaluation.online_version) return

    router.push({
      name: 'EvaluationCorrections',
      params: { id: evaluation.online_version.id }
    })
  }

  // Sync to KLASSCI
  async function syncToKlassci(evaluation) {
    if (!evaluation.online_version) return

    const submissionsCount = evaluation.online_version.submissions_count || 0
    if (submissionsCount === 0) {
      toast.warning('Aucune soumission à synchroniser')
      return
    }

    if (!(await useConfirm().confirm({ message: `Synchroniser ${submissionsCount} note(s) vers KLASSCI ?` }))) {
      return
    }

    syncing.value = evaluation.id
    try {
      const result = await evaluationService.syncToKlassci(evaluation.online_version.id)
      if (result.success) {
        toast.success('Notes synchronisées avec succès vers KLASSCI !')
        await loadEvaluationsLMS()
      }
    } catch (err) {
      console.error('[ERREUR] Synchronisation:', err)
      toast.error('Erreur lors de la synchronisation')
    } finally {
      syncing.value = null
    }
  }

  // Publish evaluation
  async function publishEvaluation(evaluation) {
    if (!evaluation.online_version) return

    const questionsCount = evaluation.online_version.questions_count || 0
    if (questionsCount === 0) {
      toast.error('Impossible de publier : ajoutez d\'abord des questions à cette évaluation.')
      return
    }

    if (!(await useConfirm().confirm({ message: `Publier "${evaluation.titre}" ? Les étudiants pourront la voir.` }))) {
      return
    }

    try {
      const result = await evaluationService.publishEvaluation(evaluation.online_version.id)
      if (result.success) {
        toast.success('Évaluation publiée avec succès !')
        await loadEvaluationsLMS()
      }
    } catch (err) {
      console.error('[ERREUR] Publication:', err)
      const message = err.response?.data?.message || 'Erreur lors de la publication'
      toast.error(message)
    }
  }

  // Preview evaluation
  function previewEvaluation(evaluation) {
    if (!evaluation.online_version) return

    router.push({
      name: 'PreviewEvaluation',
      params: { id: evaluation.online_version.id }
    })
  }

  // Delete evaluation
  async function deleteEvaluation(evaluation) {
    if (!evaluation.online_version) return

    if (!(await useConfirm().confirm({ message: `Supprimer la version en ligne de "${evaluation.titre}" ? Cette action est irréversible.`, variant: 'danger', confirmLabel: 'Supprimer' }))) {
      return
    }

    try {
      const result = await evaluationService.deleteEvaluation(evaluation.online_version.id)
      if (result.success) {
        toast.success('Version en ligne supprimée.')
        await loadEvaluationsLMS()
      }
    } catch (err) {
      console.error('[ERREUR] Suppression:', err)
      const message = err.response?.data?.message || 'Erreur lors de la suppression'
      toast.error(message)
    }
  }

  return {
    // état modale
    syncing,
    showCreateModal,
    selectedEvaluation,
    creating,
    onlineForm,
    // actions
    createOnlineVersion,
    closeCreateModal,
    submitCreateOnlineVersion,
    editOnlineVersion,
    viewResults,
    syncToKlassci,
    publishEvaluation,
    previewEvaluation,
    deleteEvaluation
  }
}
