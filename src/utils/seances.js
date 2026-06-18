/**
 * Logique métier PURE des séances enseignant (#28).
 *
 * Extraite de `views/TeacherSeances.vue` (god-component) : filtrage
 * (matière / statut visio / période) et statistiques. Fonctions pures.
 */

/**
 * Filtre une liste de séances.
 * @param {Array<Object>} seances
 * @param {{ matiere_id?: string|number, visio_status?: string, period?: 'all'|'today'|'week'|'month' }} filters
 * @returns {Array<Object>}
 */
export function filterSeances(seances = [], filters = {}) {
  let filtered = seances

  if (filters.matiere_id) {
    filtered = filtered.filter((s) => s.matiere?.id == filters.matiere_id)
  }

  if (filters.visio_status) {
    if (filters.visio_status === 'none') {
      filtered = filtered.filter((s) => !s.visio || !s.visio.enabled)
    } else {
      filtered = filtered.filter((s) => s.visio?.status === filters.visio_status)
    }
  }

  if (filters.period && filters.period !== 'all') {
    const now = new Date()
    filtered = filtered.filter((s) => {
      if (!s.programmation?.date) return false
      const seanceDate = new Date(s.programmation.date)

      if (filters.period === 'today') {
        return seanceDate.toDateString() === now.toDateString()
      }
      if (filters.period === 'week') {
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 7)
        return seanceDate >= weekStart && seanceDate < weekEnd
      }
      if (filters.period === 'month') {
        return seanceDate.getMonth() === now.getMonth() &&
          seanceDate.getFullYear() === now.getFullYear()
      }
      return true
    })
  }

  return filtered
}

/**
 * Statistiques des séances par statut visio.
 * @param {Array<Object>} seances
 * @returns {{ total:number, active:number, scheduled:number, finished:number }}
 */
export function computeSeancesStats(seances = []) {
  return {
    total: seances.length,
    active: seances.filter((s) => s.visio?.status === 'active').length,
    scheduled: seances.filter((s) => s.visio?.status === 'programmee').length,
    finished: seances.filter((s) => s.visio?.status === 'terminee').length
  }
}
