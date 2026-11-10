import { useRouter } from 'vue-router'
import evaluationService from '@/services/evaluation'
import { auth } from '@/services/api'
import { toast } from '@/composables/useToast'
import { messageForReason } from '@/services/errorHandler'
import { displayMessage } from '@/services/displayMessage'
import { copieRendue } from '@/utils/studentEvaluationStatus'

const DEMARRAGE_IMPOSSIBLE = 'Impossible de démarrer l’évaluation.'

/**
 * LA porte d'une évaluation, côté élève : « Mes évaluations », le calendrier et la page d'une matière
 * passent par elle. Une garde (`demarrageEvaluationUnePorte.test.js`) refuse toute autre entrée vers
 * la page de passage ou vers le démarrage.
 *
 * - `startEvaluation` appelle `POST /evaluations/{id}/start`, ouvre la copie créée (`submission_id`,
 *   plus `practice` pour un entraînement), et dit le motif d'un refus (lms_backend #1011), jamais le
 *   texte du serveur (D0). Un verrou empêche deux démarrages simultanés.
 * - `continueEvaluation` rouvre une copie en cours.
 * - `ouvrirEvaluation` décide pour les entrées qui ne connaissent pas l'état de la copie : copie en
 *   cours → reprise ; copie rendue → résultats ; sinon → démarrage.
 *
 * Revue de #514 puis de #515 : le calendrier et la page d'une matière ouvraient la page de passage
 * sans appeler le serveur (« ID de soumission manquant »).
 */
export function useStartEvaluation() {
  const router = useRouter()
  let enCours = false

  /** @param {{id: number}} evaluation */
  async function startEvaluation(evaluation) {
    if (enCours) return
    const user = auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    enCours = true
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
    } finally {
      enCours = false
    }
  }

  /** @param {{id: number, student_submission: {id: number}}} evaluation copie en cours */
  function continueEvaluation(evaluation) {
    router.push({ name: 'TakeEvaluation', params: { id: evaluation.id }, query: { submission_id: evaluation.student_submission.id } })
  }

  /** @param {{id: number, student_submission?: {id: number, status: string}|null}} evaluation */
  function ouvrirEvaluation(evaluation) {
    const copie = evaluation.student_submission
    if (copieRendue(copie)) return router.push({ name: 'EvaluationResults', params: { id: evaluation.id } })
    return startEvaluation(evaluation)
  }

  return { startEvaluation, continueEvaluation, ouvrirEvaluation }
}
