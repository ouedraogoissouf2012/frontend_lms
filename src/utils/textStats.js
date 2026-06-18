/**
 * Statistiques de texte PURES (#28).
 *
 * Extraites de `components/common/TipTapEditor.vue` (god-component) :
 * comptage de mots et de caractères. Fonctions pures → testables.
 */

/**
 * Nombre de mots (séparés par des espaces) dans un texte.
 * @param {string} text
 * @returns {number}
 */
export function countWords(text) {
  if (!text) return 0
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length
}

/**
 * Nombre de caractères d'un texte.
 * @param {string} text
 * @returns {number}
 */
export function countCharacters(text) {
  return text ? text.length : 0
}
