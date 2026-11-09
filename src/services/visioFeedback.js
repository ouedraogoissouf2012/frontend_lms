import { confirmDialog } from '@/services/confirmDialog'
import { toast } from '@/composables/useToast'
import { normalizeError } from '@/services/errorHandler'

/**
 * Le message d'un toast de visio : le SENS, jamais un texte venu d'ailleurs (D0).
 * - une erreur de l'intercepteur porte déjà `userMessage` (son `reason` traduit) ;
 * - une erreur HTTP sans `userMessage` : la catégorie de `normalizeError` (statut ou `reason`) ;
 * - toute autre erreur (le fournisseur de visio rejette avec `service_unavailable`…) : le repli
 *   rédigé par l'appelant. Ni `response.data.message`, ni `error.message` ne sont affichés.
 */
function messageFrom(error, fallback) {
  if (!error) return fallback
  if (error.userMessage) return error.userMessage
  if (error.response) return normalizeError(error).userMessage
  return error.message || fallback
}

export function notifyVisioSuccess(message) {
  toast.success(message, 'Visio')
}

export function notifyVisioInfo(message) {
  if (typeof toast.info === 'function') toast.info(message, 'Visio')
  else toast.success(message, 'Visio')
}

export function notifyVisioWarning(message) {
  if (typeof toast.warning === 'function') toast.warning(message, 'Visio')
  else toast.info(message, 'Visio')
}

export function notifyVisioError(error, fallback = 'Erreur visio') {
  toast.error(messageFrom(error, fallback), 'Visio')
}

export function confirmVisioAction(message, options = {}) {
  return confirmDialog({
    title: options.title || 'Confirmation visio',
    message,
    confirmLabel: options.confirmLabel || 'Confirmer',
    cancelLabel: options.cancelLabel || 'Annuler',
    variant: options.variant || 'primary',
  })
}
