/**
 * Les marques de l'appel (lms_backend#1649, #719), dans l'ordre du serveur (`AttendanceMark`), et le libellé de la
 * présence visio d'un élève. La marque l'emporte sur la visio dans tout comptage : l'écran montre les deux, côte à côte.
 */
export const MARQUES_DE_PRESENCE = Object.freeze([
  Object.freeze({ valeur: 'present', libelle: 'Présent' }),
  Object.freeze({ valeur: 'absent', libelle: 'Absent' }),
  Object.freeze({ valeur: 'late', libelle: 'En retard' }),
  Object.freeze({ valeur: 'excused', libelle: 'Excusé' }),
])

const PRESENCES_VISIO = Object.freeze({
  connected: 'Connecté',
  disconnected: 'Venu, puis déconnecté',
  kicked: 'Exclu de la visio',
})

/**
 * Le libellé de la présence visio ; sans connexion visio (ou statut inconnu), on le dit.
 * @param {?string} statut
 * @returns {string}
 */
export function libellePresenceVisio(statut) {
  return PRESENCES_VISIO[statut] ?? 'Pas de visio'
}
