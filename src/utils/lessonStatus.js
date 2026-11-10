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

// Présentation des badges (classes utilitaires et icône), par clé du serveur. Venus de
// services/lesson (décision de la superviseure) : un badge est de la présentation, pas un appel.
const CLASSES_STATUT = Object.freeze({
  draft: 'bg-gray-200 text-gray-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-orange-100 text-orange-700',
})
const STYLES_TYPE = Object.freeze({
  cours: { class: 'bg-blue-100 text-blue-700', icon: 'fa-book' },
  tp: { class: 'bg-purple-100 text-purple-700', icon: 'fa-laptop' },
  td: { class: 'bg-indigo-100 text-indigo-700', icon: 'fa-pencil' },
  projet: { class: 'bg-pink-100 text-pink-700', icon: 'fa-rocket' },
  autre: { class: 'bg-gray-100 text-gray-700', icon: 'fa-file-text-o' },
})

/** @param {*} status @returns {{class: string, text: string}|null} `null` : statut inconnu, aucun badge */
export function lessonStatusBadge(status) {
  const text = lessonStatusLabel(status)
  return text ? { class: CLASSES_STATUT[status], text } : null
}

/** @param {*} type @returns {{class: string, icon: string, text: string}|null} `null` : type inconnu, aucun badge */
export function lessonTypeBadge(type) {
  const text = lessonTypeLabel(type)
  return text ? { ...STYLES_TYPE[type], text } : null
}
