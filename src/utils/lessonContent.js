/**
 * Logique pure du contenu de leçon côté étudiant (#28).
 *
 * Extraite de `views/student/StudentLessonView.vue` (god-component) : URL
 * d'embed vidéo, URLs de média (slides/PDF via storage), mappers de type, et
 * test de chapitre vide. Fonctions pures (URLs storage : dépendent de apiOrigin).
 */
import { apiOrigin } from '@/constants/http'

/**
 * URL d'embed YouTube/Vimeo à partir d'une URL vidéo, ou null.
 * @param {string} url
 * @returns {string|null}
 */
export function getVideoEmbedUrl(url) {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return null
}

/**
 * URL d'une slide (absolue telle quelle, sinon préfixée par le storage backend).
 * @param {string} slide
 * @returns {string}
 */
export function getSlideUrl(slide) {
  if (!slide) return ''
  if (slide.startsWith('http')) return slide
  return `${apiOrigin()}/storage/${slide}`
}

/**
 * URL du PDF d'un chapitre (pdf_url ou file_converted_path).
 * @param {Object} chapter
 * @returns {string}
 */
export function getPdfUrl(chapter) {
  const path = chapter.pdf_url || chapter.file_converted_path
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${apiOrigin()}/storage/${path}`
}

const CONTENT_TYPE_LABELS = {
  text: 'Texte',
  video: 'Vidéo',
  powerpoint: 'Présentation',
  word: 'Document',
  pdf: 'PDF',
  link: 'Lien externe',
  quiz: 'Quiz'
}

const CONTENT_TYPE_ICONS = {
  text: 'fa fa-file-text-o',
  video: 'fa fa-play-circle',
  powerpoint: 'fa fa-file-powerpoint-o',
  word: 'fa fa-file-word-o',
  pdf: 'fa fa-file-pdf-o',
  link: 'fa fa-link',
  quiz: 'fa fa-question-circle'
}

/** Libellé du type de contenu (côté étudiant ; fallback : type brut). */
export function getContentTypeLabel(type) {
  return CONTENT_TYPE_LABELS[type] || type
}

/** Icône FontAwesome du type de contenu (fallback : fichier générique). */
export function getContentTypeIcon(type) {
  return CONTENT_TYPE_ICONS[type] || 'fa fa-file-o'
}

/**
 * Un chapitre est-il vide (selon son type de contenu) ?
 * @param {Object} chapter
 * @param {boolean} hasQuiz - existe-t-il un quiz pour le chapitre (type quiz) ?
 * @returns {boolean}
 */
export function isChapterContentEmpty(chapter, hasQuiz = false) {
  if (!chapter) return true
  switch (chapter.content_type) {
    case 'text': return !chapter.content
    case 'video': return !chapter.video_url
    case 'powerpoint': return !chapter.slides_images || chapter.slides_images.length === 0
    case 'word': return !chapter.content
    case 'pdf': return !chapter.pdf_url && !chapter.file_converted_path
    case 'link': return !chapter.external_link
    case 'quiz': return !hasQuiz
    default: return true
  }
}
