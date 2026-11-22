/**
 * Logique pure de gestion des chapitres (G5).
 *
 * Extraite de `components/lessons/ChapterManager.vue` pour ramener son `<script>`
 * sous 300 lignes : fabrique de chapitre vide et sélection des champs persistés.
 * Fonctions pures → testables et garantes de la parité du payload envoyé à l'API.
 */

import { VIDEOS_INTERNES } from '@/constants/chapterVideo'

/**
 * Construit un nouveau chapitre vide (état d'édition local, pas encore persisté).
 * `order` et `tempId` sont injectés par l'appelant pour rester sans effet de bord.
 * @param {number} order  position dans la liste (= longueur actuelle)
 * @param {number} tempId identifiant temporaire unique côté client
 */
export function createEmptyChapter(order, tempId) {
  return {
    tempId,
    title: '',
    content_type: 'text',
    content: '',
    video_url: '',
    external_link: '',
    autoplay_video: false,
    order,
    isEditing: true,
    isNew: true
  }
}

/**
 * La vidéo du chapitre est-elle un fichier de la plateforme (#616) ? Son `video_url` est alors une URL signée.
 * @param {object} chapter
 */
export function estVideoInterne(chapter) {
  return VIDEOS_INTERNES.includes(chapter?.video_provider)
}

/**
 * Réduit un chapitre à son payload persistable (exclut tout état UI local :
 * isEditing, isNew, selectedFile, _originalState…). Les champs et leur ordre
 * sont identiques à l'objet inline d'origine pour préserver la parité backend.
 * #616 : pour une vidéo interne, `video_url` est OMIS (l'URL signée lue n'est pas le chemin du fichier).
 * @param {object} chapter
 */
export function buildChapterPayload(chapter) {
  const payload = {
    title: chapter.title,
    content_type: chapter.content_type,
    content: chapter.content,
    video_url: chapter.video_url,
    external_link: chapter.external_link,
    autoplay_video: chapter.autoplay_video,
    order: chapter.order
  }
  if (estVideoInterne(chapter)) delete payload.video_url
  return payload
}
