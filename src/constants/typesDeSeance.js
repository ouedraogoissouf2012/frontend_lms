/**
 * Le type d'une séance (lms_backend#1668, écran #675) : la liste FERMÉE du serveur (`TypeDeSeance`), dans
 * son ordre. Une séance sans type porte `null` ; l'écran ne dit alors rien, il n'invente pas de type.
 */
export const TYPES_DE_SEANCE = Object.freeze([
  Object.freeze({ valeur: 'cm', libelle: 'Cours magistral (CM)' }),
  Object.freeze({ valeur: 'td', libelle: 'Travaux dirigés (TD)' }),
  Object.freeze({ valeur: 'tp', libelle: 'Travaux pratiques (TP)' }),
  Object.freeze({ valeur: 'projet', libelle: 'Projet' }),
  Object.freeze({ valeur: 'travail_personnel', libelle: 'Travail personnel' }),
  Object.freeze({ valeur: 'examen', libelle: 'Examen' }),
])

/**
 * Le libellé d'un type, ou `null` (sans type, ou valeur hors de la liste : rien n'est affiché).
 * @param {?string} valeur
 * @returns {?string}
 */
export function libelleDuType(valeur) {
  return TYPES_DE_SEANCE.find((t) => t.valeur === valeur)?.libelle ?? null
}

/**
 * Les motifs d'un conflit d'horaire : des identifiants stables du serveur (ADR-906-01), traduits ici.
 * Un motif inconnu n'est pas affiché.
 */
export const MOTIFS_DE_CONFLIT = Object.freeze({
  teacher: 'Même enseignant',
  class: 'Même classe',
})
