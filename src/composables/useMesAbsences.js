import { ref } from 'vue'
import { justificatifsService } from '@/services/justificatifs'
import { messageDe } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const ENVOYE = 'Justificatif envoyé : la gestion de l’école va le traiter.'

/**
 * « Mes absences » côté élève (lms_backend#1681, #687) : ses absences justifiables, ses justificatifs, le dépôt.
 *
 * - Une absence déjà visée par un justificatif EN ATTENTE ne se recoche pas (`justifiable: false`) ; après un refus,
 *   elle redevient justifiable ;
 * - rien ne part sans séance cochée ni sans motif (le serveur reste juge du reste) ;
 * - D0 : un refus est dit par le catalogue des motifs, jamais par le texte du serveur.
 */
export function useMesAbsences() {
  const absences = ref([])
  const justificatifs = ref([])
  const selection = ref([])
  const motif = ref('')
  const piece = ref(null)
  const chargement = ref(false)
  const envoi = ref(false)
  const erreur = ref('')
  const message = ref('')

  async function charger() {
    chargement.value = true
    erreur.value = ''
    try {
      const [lues, deposes] = await Promise.all([justificatifsService.mesAbsences(), justificatifsService.mesJustificatifs()])
      absences.value = lues.map((a) => ({ ...a, justifiable: a.justificatif_etat !== 'en_attente' }))
      justificatifs.value = deposes
    } catch (err) {
      erreur.value = messageDe(err)
    } finally {
      chargement.value = false
    }
  }

  /** @returns {Promise<boolean>} vrai si le justificatif est déposé */
  async function deposer() {
    if (envoi.value) return false
    message.value = ''
    const texte = motif.value.trim()
    if (selection.value.length === 0) {
      erreur.value = ERROR_MESSAGES.justificatifSansSeance
      return false
    }
    if (texte === '') {
      erreur.value = ERROR_MESSAGES.justificatifSansMotif
      return false
    }
    envoi.value = true
    erreur.value = ''
    try {
      await justificatifsService.deposer({ motif: texte, seanceIds: selection.value, piece: piece.value })
      message.value = ENVOYE
      selection.value = []
      motif.value = ''
      piece.value = null
      await charger()
      return true
    } catch (err) {
      erreur.value = messageDe(err)
      return false
    } finally {
      envoi.value = false
    }
  }

  return { absences, justificatifs, selection, motif, piece, chargement, envoi, erreur, message, charger, deposer }
}
