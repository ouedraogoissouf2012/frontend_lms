import { ref } from 'vue'
import { enrolmentCodesService } from '@/services/enrolmentCodes'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

/**
 * Normalise une saisie de code pour l'envoi : majuscules, sans espaces. Le serveur
 * reste juge du format (4 à 12 caractères) : rien n'est refusé ici.
 * @param {unknown} saisie
 * @returns {string}
 */
export function normaliserCode(saisie) {
  return String(saisie ?? '').replace(/\s+/g, '').toUpperCase()
}

/**
 * « Rejoindre une classe » côté élève (#391) : POST /me/inscriptions { code }.
 *
 * « Déjà inscrit » (200) est un succès comme « rejoint » (201) : le message du serveur
 * les distingue. Les refus passent par le catalogue (motifs ADR-906-01) ; le 404 reçoit
 * un message propre, car « ressource introuvable » n'aide pas l'élève.
 */
export function useJoinClass() {
  const code = ref('')
  const submitting = ref(false)
  const error = ref('')
  const result = ref(null)

  async function rejoindre() {
    const saisie = normaliserCode(code.value)
    if (saisie === '') return false
    submitting.value = true
    error.value = ''
    result.value = null
    try {
      const response = await enrolmentCodesService.rejoindre(saisie)
      result.value = { classe: response.data?.classe ?? null, message: response.message || '' }
      return true
    } catch (err) {
      error.value = err?.response?.status === 404
        ? ERROR_MESSAGES.codeInconnu
        : (err?.userMessage || ERROR_MESSAGES.unknown)
      return false
    } finally {
      submitting.value = false
    }
  }

  return { code, submitting, error, result, rejoindre }
}
