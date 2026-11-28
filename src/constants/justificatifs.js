/**
 * Les états d'un justificatif d'absence (lms_backend#1681, #687), dans l'ordre des onglets de la gestion.
 */
export const ETATS_DE_JUSTIFICATIF = Object.freeze([
  Object.freeze({ valeur: 'en_attente', libelle: 'En attente' }),
  Object.freeze({ valeur: 'validee', libelle: 'Validé' }),
  Object.freeze({ valeur: 'rejetee', libelle: 'Refusé' }),
])

/**
 * @param {?string} etat
 * @returns {string}
 */
export function libelleEtatJustificatif(etat) {
  return ETATS_DE_JUSTIFICATIF.find((e) => e.valeur === etat)?.libelle ?? 'Inconnu'
}

/** Les pièces acceptées par le serveur (pdf, jpg, png ; 10 Mo) : l'attribut `accept` du champ, une photo comprise. */
export const PIECES_ACCEPTEES = 'application/pdf,image/jpeg,image/png'
