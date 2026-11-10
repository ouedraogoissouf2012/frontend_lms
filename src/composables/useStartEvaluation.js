import { useRouter } from 'vue-router'
import evaluationService from '@/services/evaluation'
import { auth } from '@/services/api'
import { toast } from '@/composables/useToast'
import { messageForReason } from '@/services/errorHandler'
import { displayMessage } from '@/services/displayMessage'

const DEMARRAGE_IMPOSSIBLE = 'Impossible de démarrer l’évaluation.'

/**
 * LA porte pour démarrer une évaluation (élève), partagée par « Mes évaluations » et le calendrier.
 *
 * Elle appelle `POST /evaluations/{id}/start`, ouvre la copie créée (`submission_id`, plus `practice`
 * pour un entraînement). Sur un refus, elle dit le motif traduit (lms_backend #1011 : fenêtre fermée,
 * tentatives, reprise, hors ligne), jamais le texte du serveur (D0). Constat de la revue de #514 : le
 * calendrier poussait vers la page de passage sans appeler le serveur (« ID de soumission manquant »).
 * Une garde (`demarrageEvaluationUnePorte.test.js`) refuse toute autre entrée.
 */
export function useStartEvaluation() {
  const router = useRouter()

  /** @param {{id: number}} evaluation */
  async function startEvaluation(evaluation) {
    const user = auth.getUser()
    if (!user) return

    try {
      const result = await evaluationService.startEvaluation(evaluation.id, user.klassci_id)
      if (result.success) {
        const query = { submission_id: result.data.id }
        if (result.is_practice) query.practice = '1'
        router.push({ name: 'TakeEvaluation', params: { id: evaluation.id }, query })
      } else {
        // Réponse hors intercepteur : son `reason` traduit, jamais son `message` (D0).
        toast.error(messageForReason(result.reason) ?? DEMARRAGE_IMPOSSIBLE)
      }
    } catch (err) {
      console.error('Erreur démarrage évaluation:', err)
      toast.error(displayMessage(err, DEMARRAGE_IMPOSSIBLE))
    }
  }

  return { startEvaluation }
}
