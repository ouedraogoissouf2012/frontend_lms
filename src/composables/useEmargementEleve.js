import { ref } from 'vue'
import { emargementService } from '@/services/emargement'
import { messageDe } from '@/services/errorHandler'
import { normaliserCode } from '@/composables/useJoinClass'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const PRESENT = 'Votre présence est enregistrée.'
const EN_RETARD = 'Votre présence est enregistrée, en retard.'
const DEJA_SIGNE = 'Vous aviez déjà signé cette séance.'

/**
 * L'élève signe sa présence par le code de la séance (lms_backend#1680, #335) : `POST /lms/emargement { code }`.
 *
 * Le front dit ses propres textes (présent, en retard, déjà signé), jamais celui du serveur ; les refus passent par
 * le catalogue des motifs, dont le plafond d'essais avec son délai. La saisie est normalisée comme le code
 * d'inscription ; le serveur reste juge du code.
 *
 * @param {unknown} codeInitial le code du QR (`?code=`), s'il y en a un
 */
export function useEmargementEleve(codeInitial = '') {
  const code = ref(typeof codeInitial === 'string' ? codeInitial : '')
  const envoi = ref(false)
  const erreur = ref('')
  const resultat = ref('')

  async function signer() {
    if (envoi.value) return false
    const saisie = normaliserCode(code.value)
    resultat.value = ''
    if (saisie === '') {
      erreur.value = ERROR_MESSAGES.codeVide
      return false
    }
    envoi.value = true
    erreur.value = ''
    try {
      const signature = await emargementService.signer(saisie)
      resultat.value = signature.deja_signe ? DEJA_SIGNE : (signature.mark === 'late' ? EN_RETARD : PRESENT)
      return true
    } catch (err) {
      erreur.value = messageDe(err)
      return false
    } finally {
      envoi.value = false
    }
  }

  return { code, envoi, erreur, resultat, signer }
}
