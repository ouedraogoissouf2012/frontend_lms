import { ref } from 'vue'
import { auth } from '@/services/api'
import { extractList } from '../utils/apiList'
import { passwordResetService } from '@/services/passwordReset'
import { displayMessage } from '@/services/displayMessage'
import { messageForReason } from '@/services/errorHandler'
import { estInformation } from '@/services/refusalReasons'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

// #613 : le seul motif qui dit qu'un lien part (si le compte existe). Les autres disent où se réinitialise le mot de
// passe, ou que rien ne part : une information, pas un succès.
const LIEN_ENVOYE = 'lien_envoye'

export function usePasswordReset() {
  const loading = ref(false)
  const error = ref('')
  const notice = ref('')
  // Le ton de `notice` : 'succes' ou 'information' ; vide sans notice.
  const noticeTone = ref('')
  const institutions = ref([])

  async function loadInstitutions() {
    const payload = await auth.getActiveInstitutions()
    institutions.value = extractList(payload)
  }

  async function requestLink(slug, email) {
    loading.value = true
    error.value = ''
    notice.value = ''
    noticeTone.value = ''
    try {
      // #613 : le texte vient du motif (catalogue du front, D0), jamais du serveur. Un motif absent, inconnu ou de refus
      // rend un texte neutre : la demande est reçue, rien n'est promis.
      const { reason } = (await passwordResetService.requestLink(slug, email)) ?? {}
      notice.value = estInformation(reason) ? messageForReason(reason) : ERROR_MESSAGES.demandeDeReinitialisationRecue
      noticeTone.value = reason === LIEN_ENVOYE ? 'succes' : 'information'
      return true
    } catch (err) {
      error.value = displayMessage(err, 'La demande a échoué.')
      return false
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(slug, payload) {
    loading.value = true
    error.value = ''
    notice.value = ''
    noticeTone.value = ''
    try {
      await passwordResetService.resetPassword(slug, payload)
      notice.value = 'Mot de passe mis à jour.'
      noticeTone.value = 'succes'
      return true
    } catch (err) {
      error.value = displayMessage(err, 'La réinitialisation a échoué.')
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    notice,
    noticeTone,
    institutions,
    loadInstitutions,
    requestLink,
    resetPassword,
  }
}
