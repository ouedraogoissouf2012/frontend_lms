/**
 * Vidéo INTERNE d'un chapitre (#616) : un fichier de la plateforme, pas un lien.
 *
 * Miroir de `RecordingVideoService::NOS_FICHIERS` (lms_backend#1287) : `jibri` (enregistrement d'une séance) et
 * `upload` (vidéo rangée par le serveur). Son `video_url` est une URL SIGNÉE, valable quelques heures, que le
 * serveur ignore à la modification : l'écran ne la propose donc plus à l'édition.
 *
 * Aucun texte ne promet un remplacement : aucun type vidéo n'est téléversable (UploadFileRequest). Supprimer ou
 * remplacer une vidéo interne est une décision produit, pas encore prise.
 */
export const MENTIONS_VIDEO_INTERNE = Object.freeze({
  jibri: 'Vidéo enregistrée lors d\'une séance',
  upload: 'Vidéo téléversée',
})

export const VIDEOS_INTERNES = Object.freeze(Object.keys(MENTIONS_VIDEO_INTERNE))

export const VIDEO_INTERNE_CONSERVEE = 'Cette vidéo est conservée par la plateforme : son adresse ne se modifie pas ici.'
