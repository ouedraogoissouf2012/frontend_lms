/**
 * Logique pure du contenu de leçon côté étudiant (#28).
 *
 * Extraite de `views/student/StudentLessonView.vue` (god-component) : URL
 * d'embed vidéo, URLs de média (slides/PDF via storage), mappers de type, et
 * test de chapitre vide. Fonctions pures (URLs storage : dépendent de apiOrigin).
 */
import { apiOrigin } from '@/constants/http'

const WEB_URL_PATTERN = /^https?:\/\//i
const SCHEME_RELATIVE_PATTERN = /^\/\//
const EXPLICIT_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i

function stringOrEmpty(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * URL d'embed YouTube/Vimeo à partir d'une URL vidéo, ou null.
 * @param {string} url
 * @returns {string|null}
 */
export function getVideoEmbedUrl(url) {
  const rawUrl = stringOrEmpty(url)
  if (!WEB_URL_PATTERN.test(rawUrl)) return null

  let parsed
  try {
    parsed = new URL(rawUrl)
  } catch {
    return null
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const watchId = parsed.searchParams.get('v')
    const embedId = parsed.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/)?.[1]
    const videoId = watchId || embedId
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null
  }
  if (host === 'youtu.be') {
    const videoId = parsed.pathname.match(/^\/([a-zA-Z0-9_-]{11})/)?.[1]
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null
  }
  if (host === 'vimeo.com') {
    const videoId = parsed.pathname.match(/^\/(\d+)/)?.[1]
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null
  }
  return null
}

/**
 * URL média stockée côté backend : absolue telle quelle, sinon préfixée par le
 * storage backend. Les schémas explicites non web sont rejetés.
 * @param {string} path
 * @returns {string}
 */
export function getStorageAssetUrl(path) {
  const value = stringOrEmpty(path)
  if (!value) return ''
  if (WEB_URL_PATTERN.test(value) || SCHEME_RELATIVE_PATTERN.test(value)) return value
  if (EXPLICIT_SCHEME_PATTERN.test(value)) return ''
  if (value.startsWith('/storage/')) return `${apiOrigin()}${value}`
  if (value.startsWith('storage/')) return `${apiOrigin()}/${value}`
  if (value.startsWith('/')) return `${apiOrigin()}${value}`
  return `${apiOrigin()}/storage/${value}`
}

/**
 * URL ouvrable pour une vidéo non intégrable.
 * @param {string} url
 * @returns {string}
 */
export function getVideoOpenUrl(url) {
  return getStorageAssetUrl(url)
}

/**
 * URL d'une slide (absolue telle quelle, sinon préfixée par le storage backend).
 * @param {string} slide
 * @returns {string}
 */
export function getSlideUrl(slide) {
  return getStorageAssetUrl(slide)
}

/**
 * URL du PDF d'un chapitre (pdf_url ou file_converted_path).
 * @param {Object} chapter
 * @returns {string}
 */
export function getPdfUrl(chapter) {
  const path = chapter.pdf_url || chapter.file_converted_path
  return getStorageAssetUrl(path)
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
