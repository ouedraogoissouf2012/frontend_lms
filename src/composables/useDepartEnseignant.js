import { onMounted, onBeforeUnmount } from 'vue'
import lmsService from '@/services/lms'
import { userError } from '@/utils/userError'
import { messageForReason } from '@/services/errorHandler'
import { confirmVisioAction, notifyVisioSuccess, notifyVisioError } from '@/services/visioFeedback'

const QUESTION = 'Vous avez quitté la salle. Terminer la visio pour tous les participants ?'

/**
 * #582 : `visio:teacher-left` (stores/visio.js) est émis quand l'enseignant quitte la salle. Son intention est écrite
 * dans le store : « les écrans dédiés exposent l'action terminer pour tous ». Sans écouteur, les élèves restaient
 * dans une visio que plus personne ne menait. On demande donc à l'enseignant s'il la termine pour tous.
 * Monté par `VisioRoom` (racine) : l'écoute vit le temps du composant.
 */
export function useDepartEnseignant() {
  async function surDepart(evenement) {
    const seanceId = evenement?.detail?.seanceId
    if (!seanceId) return
    if (!await confirmVisioAction(QUESTION, { confirmLabel: 'Terminer pour tous', variant: 'danger' })) return
    try {
      const response = await lmsService.endVisio(seanceId)
      if (!response?.success) throw userError(messageForReason(response?.reason) ?? 'La visio n’a pas pu être terminée')
      notifyVisioSuccess('Visio terminée pour tous les participants.')
    } catch (error) {
      notifyVisioError(error, 'La visio n’a pas pu être terminée')
    }
  }

  onMounted(() => window.addEventListener('visio:teacher-left', surDepart))
  onBeforeUnmount(() => window.removeEventListener('visio:teacher-left', surDepart))
}
