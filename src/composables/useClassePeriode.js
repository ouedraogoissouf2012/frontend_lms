import { ref } from 'vue'
import { enrolmentCodesService } from '@/services/enrolmentCodes'
import { invalidResponseError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

/**
 * Rattacher une classe LOCALE à sa période (#657, lms_backend#1208) : `PUT /classes/{id}/periode`,
 * corps `{ training_session_id: id | null }` EXIGÉ, réponse `data: { id, training_session_id }`.
 *
 * L'écran dit ce que le SERVEUR a enregistré : après le PUT, c'est `data.training_session_id` relu qui
 * est rendu, jamais le choix. Même discipline que la capacité (#631) : un refus NET (4xx) n'a rien
 * changé ; sans statut ou en 5xx, le serveur a pu enregistrer, la période affichée devient incertaine.
 *
 * @param {() => object} classe - lecture de la classe courante (forme de `GET /classes`)
 * @param {(trainingSessionId: number|null) => void} onRattachee - reçoit la période RELUE du serveur
 */
export function useClassePeriode(classe, onRattachee) {
  const ouvert = ref(false)
  // Le choix, en texte : '' = aucune période, sinon l'identifiant.
  const choix = ref('')
  const erreur = ref('')
  const occupe = ref(false)
  const incertaine = ref(false)

  function ouvrir() {
    const id = classe()?.training_session_id
    choix.value = Number.isInteger(id) ? String(id) : ''
    erreur.value = ''
    ouvert.value = true
  }

  function annuler() {
    ouvert.value = false
    erreur.value = ''
  }

  async function enregistrer() {
    if (occupe.value) return false
    const periode = choix.value === '' ? null : Number(choix.value)
    occupe.value = true
    erreur.value = ''
    try {
      const response = await enrolmentCodesService.rattacherPeriode(classe().id, periode)
      const relue = response.data?.training_session_id
      if (!(relue === null || Number.isInteger(relue))) throw invalidResponseError('PUT période sans période relisible', response)
      incertaine.value = false
      ouvert.value = false
      onRattachee(relue)
      return true
    } catch (err) {
      erreur.value = err?.userMessage || ERROR_MESSAGES.unknown
      const status = err?.response?.status
      if (status == null || status >= 500) incertaine.value = true
      return false
    } finally {
      occupe.value = false
    }
  }

  return { ouvert, choix, erreur, occupe, incertaine, ouvrir, annuler, enregistrer }
}
