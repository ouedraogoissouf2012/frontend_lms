import lessonService from '@/services/lesson'
import { formatDateShort } from '@/utils/formatters'

/**
 * Helpers de présentation de LessonCard (#H4 ≤300). Mappe type/status/contenu vers
 * icônes et libellés, et relaie durée/date/badges au service leçon. Pur (aucun état) :
 * partagé tel quel par LessonCard et ses sous-composants (badges, actions).
 */
const TYPE_ICONS = {
  cours: 'fa-book',
  tp: 'fa-laptop',
  td: 'fa-pencil',
  projet: 'fa-rocket',
  autre: 'fa-file-text-o'
}

const STATUS_ICONS = {
  draft: 'fa-pencil',
  published: 'fa-check',
  archived: 'fa-archive'
}

const CONTENT_TYPE_ICONS = {
  text: 'fa-pencil-square-o',
  video: 'fa-video-camera',
  pdf: 'fa-file-pdf-o',
  audio: 'fa-music',
  presentation: 'fa-bar-chart',
  link: 'fa-link',
  mixed: 'fa-book'
}

const CONTENT_TYPE_LABELS = {
  text: 'Texte',
  video: 'Vidéo',
  pdf: 'PDF',
  audio: 'Audio',
  presentation: 'Présentation',
  link: 'Lien',
  mixed: 'Mixte'
}

export function useLessonCard() {
  const getTypeIcon = (type) => TYPE_ICONS[type] || 'fa-question-circle'
  const getStatusIcon = (status) => STATUS_ICONS[status] || 'fa-circle'
  const getContentTypeIcon = (type) => CONTENT_TYPE_ICONS[type] || 'fa-file-o'
  const getContentTypeLabel = (type) => CONTENT_TYPE_LABELS[type] || 'Inconnu'
  const formatDuration = (minutes) => lessonService.formatDuration(minutes)
  const formatDate = (dateString) => formatDateShort(dateString, { fallback: 'N/A' })
  const getTypeBadge = (type) => lessonService.getTypeBadge(type)
  const getStatusBadge = (status) => lessonService.getStatusBadge(status)

  return {
    getTypeIcon,
    getStatusIcon,
    getContentTypeIcon,
    getContentTypeLabel,
    formatDuration,
    formatDate,
    getTypeBadge,
    getStatusBadge
  }
}
