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
