import { confirmDialog } from '@/services/confirmDialog'
import { toast } from '@/services/toast'
import { normalizeError } from '@/services/errorHandler'

function messageFrom(error, fallback) {
  if (!error) return fallback
  return error.userMessage ||
    error.response?.data?.message ||
    error.message ||
    normalizeError(error).userMessage ||
    fallback
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
