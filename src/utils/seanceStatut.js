/**
 * Statut d'une séance, lu d'abord sur sa visio, puis sur l'horaire (lot « lecture honnête », spec 3d).
 *
 * Une fin ESTIMÉE (`heure_fin_estimee` : le début plus 2 h, non mesurée, dans une école créée depuis
 * le LMS et sur le chemin gestion de KLASSCI) n'affirme jamais « Terminée » : passée sans visio
 * confirmée, la séance est « Non confirmée ». Une fin réelle garde la fenêtre horaire d'avant.
 *
 * @param {object} seance
 * @param {Date} [maintenant]
 * @returns {'active'|'scheduled'|'completed'|'unconfirmed'}
 */
export function statutSeance(seance, maintenant = new Date()) {
  if (seance?.visio_status === 'terminee') return 'completed'
  if (seance?.visio_active) return 'active'
  const debut = new Date(seance?.date_debut)
  if (maintenant < debut) return 'scheduled'
  if (seance?.heure_fin_estimee) return 'unconfirmed'
  return maintenant <= new Date(seance?.date_fin) ? 'active' : 'completed'
}

const LIBELLES = Object.freeze({
  active: 'En cours',
  scheduled: 'Planifiée',
  completed: 'Terminée',
  unconfirmed: 'Non confirmée',
})

/** Le libellé d'un statut de séance, ou « Inconnu ». */
export function libelleStatutSeance(statut) {
  return LIBELLES[statut] || 'Inconnu'
}

/**
 * Vrai si l'heure de fin d'une séance est ESTIMÉE (début + 2 h, non mesurée) : le drapeau est porté à la
 * racine de la séance ou dans sa `programmation` (spec 3d). L'écran le dit au lieu de l'affirmer.
 */
export function finEstimee(seance) {
  return seance?.heure_fin_estimee === true || seance?.programmation?.heure_fin_estimee === true
}

/**
 * La date d'une séance depuis son jour et son heure (« HH:mm[:ss] », KLASSCI), ou depuis l'heure
 * seule quand elle est un datetime ISO (école créée depuis le LMS, spec 3d). Null si illisible :
 * rien n'est inventé. Seul analyseur de l'horaire d'une séance (liste des visios, calendrier admin).
 * @param {string} dateStr
 * @param {string} timeStr
 * @returns {Date|null}
 */
export function dateHeureSeance(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null
  // École créée depuis le LMS (spec 3d) : programmation.heure_* peut être un datetime ISO, avec ou sans
  // fuseau. KLASSCI rend « HH:mm[:ss] ». Les deux formes sont acceptées.
  if (String(timeStr).includes('T')) {
    const date = new Date(timeStr)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const [year, month, day] = String(dateStr).split('T')[0].split('-').map(Number)
  const [hour = 0, minute = 0, second = 0] = String(timeStr).split(':').map(Number)
  if ([year, month, day, hour, minute, second].some(Number.isNaN)) return null

  return new Date(year, month - 1, day, hour, minute, second)
}
