/**
 * Les heures de l'enseignant (lms_backend#1682, #688) : le libellé d'une durée et de chaque statut d'une séance.
 * La règle de comptage vit au serveur (une seule définition) ; l'écran ne fait que la dire.
 */
const STATUTS = Object.freeze({
  comptee: 'Comptée',
  visio_non_demarree: 'Visio non démarrée',
  auteur_inconnu: 'Avant le relevé',
  demarree_par_un_autre: 'Démarrée par un autre compte',
  visio_non_terminee: 'Visio non terminée',
})

/**
 * @param {?string} statut
 * @returns {string}
 */
export function libelleStatutHeures(statut) {
  return STATUTS[statut] ?? 'Inconnu'
}

/**
 * Une durée en minutes, lue en heures : `2 h 30`, `4 h`, `0 h 45`.
 * @param {number} minutes
 * @returns {string}
 */
export function dureeLisible(minutes) {
  const total = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0
  const heures = Math.floor(total / 60)
  const reste = total % 60
  return reste === 0 ? `${heures} h` : `${heures} h ${String(reste).padStart(2, '0')}`
}

/**
 * Une date `AAAA-MM-JJ` en `JJ/MM/AAAA`, sans passer par un fuseau.
 * @param {?string} jour
 * @returns {string}
 */
export function jourLisible(jour) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(jour ?? '')
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}
