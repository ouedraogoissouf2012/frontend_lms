/**
 * Logique métier PURE des présences (#28).
 *
 * Extraite de `views/attendance/SeanceAttendanceHistory.vue` (god-component) :
 * seuils de taux de présence (80 / 60 %), mappers de statut, et calcul des
 * bornes de période. Fonctions pures → testables et réutilisables.
 */

/** Convertit une Date en chaîne `YYYY-MM-DD` (local). */
function toDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Classe CSS d'un taux de présence selon les seuils projet (≥ 80 % / ≥ 60 %).
 * @param {number} rate - pourcentage de présence
 * @returns {'rate-high'|'rate-medium'|'rate-low'}
 */
export function getAttendanceRateClass(rate) {
  if (rate >= 80) return 'rate-high'
  if (rate >= 60) return 'rate-medium'
  return 'rate-low'
}

/**
 * Classe CSS du badge de statut de présence d'un participant.
 * @param {string} statusLevel - present|partial|low|absent|ongoing
 * @returns {string}
 */
export function getAttendanceStatusBadgeClass(statusLevel) {
  const base = 'status-badge'
  switch (statusLevel) {
    case 'present':
      return `${base} status-present`
    case 'partial':
      return `${base} status-partial`
    case 'low':
      return `${base} status-low`
    case 'absent':
      return `${base} status-absent`
    case 'ongoing':
      return `${base} status-ongoing`
    default:
      return base
  }
}

/** Classe CSS de l'état de connexion (`connected` → en ligne). */
export function getConnectionStatusClass(status) {
  return status === 'connected' ? 'status-online' : 'status-offline'
}

/** Libellé de l'état de connexion (`connected` → « Connecté »). */
export function getConnectionStatusLabel(status) {
  return status === 'connected' ? 'Connecté' : 'Déconnecté'
}

/**
 * Bornes de date `{ from, to }` (YYYY-MM-DD) pour une période donnée.
 * @param {'today'|'week'|'month'|'custom'} period
 * @param {{ from?: string, to?: string }} [customDates] - utilisé si period === 'custom'
 * @returns {{ from?: string, to?: string }}
 */
export function getPeriodDates(period, customDates = {}) {
  const now = new Date()
  const dates = {}

  switch (period) {
    case 'today':
      dates.from = toDateInput(now)
      dates.to = toDateInput(now)
      break
    case 'week': {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      dates.from = toDateInput(weekStart)
      dates.to = toDateInput(now)
      break
    }
    case 'month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      dates.from = toDateInput(monthStart)
      dates.to = toDateInput(now)
      break
    }
    case 'custom':
      dates.from = customDates.from
      dates.to = customDates.to
      break
  }

  return dates
}
