/**
 * Logique métier PURE du calendrier unifié (#28).
 *
 * Extraite de `components/calendar/UniversalCalendar.vue` (god-component) :
 * couleurs d'événements (séances/évaluations), urgence d'évaluation, et bornes
 * de date par préréglage. Fonctions pures → testables et réutilisables.
 */

const COLORS = {
  visioActive: '#10b981',
  visioProgrammee: '#3b82f6',
  visioTerminee: '#6b7280',
  seanceDefault: '#2563eb',
  evaluationUrgent: '#ef4444',
  evaluation: '#ea580c'
}

/** Convertit une Date en `YYYY-MM-DD`. */
function toIsoDate(date) {
  return date.toISOString().split('T')[0]
}

/**
 * Couleur d'une séance selon le statut visio.
 * @param {Object} seance
 * @returns {string} code couleur hex
 */
export function determineSeanceColor(seance) {
  switch (seance.visio?.status) {
    case 'active':
      return COLORS.visioActive
    case 'programmee':
      return COLORS.visioProgrammee
    case 'terminee':
      return COLORS.visioTerminee
    default:
      return COLORS.seanceDefault
  }
}

/**
 * Une évaluation est-elle urgente (commence dans moins de 24 h, future) ?
 * @param {Object} evaluation
 * @returns {boolean}
 */
export function isEvaluationUrgent(evaluation) {
  const dateStr = evaluation.programmation?.date_evaluation || evaluation.date_evaluation
  if (!dateStr) return false

  const evalDate = new Date(dateStr)
  if (isNaN(evalDate.getTime())) return false

  const hoursDiff = (evalDate - new Date()) / (1000 * 60 * 60)
  return hoursDiff < 24 && hoursDiff > 0
}

/**
 * Couleur d'une évaluation (rouge si urgente, orange sinon).
 * @param {Object} evaluation
 * @returns {string}
 */
export function determineEvaluationColor(evaluation) {
  return isEvaluationUrgent(evaluation) ? COLORS.evaluationUrgent : COLORS.evaluation
}

/**
 * Date de début (YYYY-MM-DD) pour un préréglage de plage.
 * @param {'today'|'week'|'month'|string} preset
 * @returns {string}
 */
export function getDateRangeStart(preset) {
  const now = new Date()
  switch (preset) {
    case 'today':
      return toIsoDate(now)
    case 'week': {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay() + 1)
      return toIsoDate(startOfWeek)
    }
    case 'month':
      return toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1))
    default:
      return toIsoDate(now)
  }
}

/**
 * Date de fin (YYYY-MM-DD) pour un préréglage de plage.
 * @param {'today'|'week'|'month'|'7days'|'30days'|'90days'|string} preset
 * @returns {string}
 */
export function getDateRangeEnd(preset) {
  const now = new Date()
  const inDays = (n) => {
    const d = new Date(now)
    d.setDate(now.getDate() + n)
    return toIsoDate(d)
  }
  switch (preset) {
    case 'today':
      return toIsoDate(now)
    case 'week': {
      const endOfWeek = new Date(now)
      endOfWeek.setDate(now.getDate() + (7 - now.getDay()))
      return toIsoDate(endOfWeek)
    }
    case 'month':
      return toIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    case '7days':
      return inDays(7)
    case '30days':
      return inDays(30)
    case '90days':
      return inDays(90)
    default:
      return inDays(30)
  }
}
