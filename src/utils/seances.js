/**
 * Logique métier PURE des séances enseignant (#28).
 *
 * Extraite de `views/TeacherSeances.vue` (god-component) : filtrage
 * (matière / statut visio / période) et statistiques. Fonctions pures.
 */

/** Nom de matière comparable (casse et espaces ignorés), ou null ('N/A' et vide ne sont pas des noms). */
function normaliserNom(nom) {
  const n = String(nom ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
  return n && n !== 'n/a' ? n : null
}

/**
 * Clé de matière d'une séance : son id, sinon « nom: » + son nom normalisé, sinon null.
 *
 * Repli DÉCLARÉ (lot « lecture honnête ») : dans une école créée depuis le LMS, une séance locale ne
 * porte pas d'id de matière (le serveur n'en a pas : pas de colonne `seances.matiere_id`). LIMITE :
 * deux matières distinctes au même nom sont alors confondues. Cible : le lot backend qui ajoute
 * `seances.matiere_id` ; le rapprochement se fera alors par l'id.
 * @param {object} seance
 * @returns {number|string|null}
 */
export function cleMatiere(seance) {
  if (seance?.matiere?.id != null) return seance.matiere.id
  const nom = normaliserNom(seance?.matiere?.nom ?? seance?.matiere_nom)
  return nom ? `nom:${nom}` : null
}

/**
 * Filtre une liste de séances.
 * @param {Array<Object>} seances
 * @param {{ matiere_id?: string|number, visio_status?: string, period?: 'all'|'today'|'week'|'month' }} filters
 * @returns {Array<Object>}
 */
export function filterSeances(seances = [], filters = {}, matieres = []) {
  let filtered = seances

  if (filters.matiere_id) {
    // Une séance locale (école créée depuis le LMS) n'a pas d'id de matière : on la rapproche par le
    // nom de la matière choisie (repli déclaré, voir cleMatiere).
    const choisie = matieres.find((m) => m.id == filters.matiere_id)
    const nomChoisi = choisie ? normaliserNom(choisie.nom) : null
    filtered = filtered.filter((s) => (s.matiere?.id != null
      ? s.matiere.id == filters.matiere_id
      : nomChoisi !== null && normaliserNom(s.matiere?.nom) === nomChoisi))
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
