/**
 * Logique pure du contenu de chapitre (#28).
 *
 * Extraite de `components/lessons/ChapterManager.vue` (god-component) :
 * libellé du type de contenu et aperçu tronqué. Fonctions pures → testables.
 */

const CONTENT_TYPE_LABELS = {
  text: 'Texte / Markdown',
  video: 'Vidéo',
  powerpoint: 'PowerPoint',
  word: 'Document Word',
  pdf: 'PDF',
  link: 'Lien externe',
  quiz: 'Quiz / Testez vos connaissances'
}

/** Libellé lisible d'un type de contenu de chapitre (fallback : le type brut). */
export function getChapterContentTypeLabel(type) {
  return CONTENT_TYPE_LABELS[type] || type
}

/**
 * Aperçu tronqué d'un contenu (150 caractères + « ... »).
 * NB : ellipsis `...` (3 points) volontairement distinct de `truncate`
 * (utils/formatters, ellipsis `…`) pour préserver l'affichage existant.
 * @param {string} content
 * @returns {string}
 */
export function getChapterContentPreview(content) {
  if (!content) return ''
  return content.length > 150 ? content.substring(0, 150) + '...' : content
}
