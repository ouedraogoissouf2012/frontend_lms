/**
 * Libellés du statut et du type d'une leçon : la SOURCE UNIQUE (ARRÊT 1 statuts de leçon).
 *
 * Les clés sont celles de l'énumération du serveur (`create_lessons_table` : status draft /
 * published / archived ; type cours / tp / td / projet / autre). Les statuts s'accordent avec
 * « une leçon » (féminin).
 *
 * Une valeur inconnue ou absente rend `''` : l'écran n'affiche alors AUCUN badge. Jamais le texte
 * brut du serveur (constat E2E : « published » sur /dashboard), jamais une valeur inventée (les
 * anciennes tables rendaient « Brouillon » pour un statut inconnu, « Cours » pour un type inconnu).
 */

const STATUTS = Object.freeze({ draft: 'Brouillon', published: 'Publiée', archived: 'Archivée' })
const TYPES = Object.freeze({ cours: 'Cours', tp: 'TP', td: 'TD', projet: 'Projet', autre: 'Autre' })

// `hasOwnProperty` : un nom hérité d'objet (« toString », « constructor ») n'est pas un statut.
const libelle = (table, cle) => (Object.prototype.hasOwnProperty.call(table, cle) ? table[cle] : '')

/** @param {*} status @returns {string} libellé français, ou '' si inconnu */
export const lessonStatusLabel = (status) => libelle(STATUTS, status)

/** @param {*} type @returns {string} libellé français, ou '' si inconnu */
export const lessonTypeLabel = (type) => libelle(TYPES, type)
