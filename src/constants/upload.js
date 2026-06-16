/**
 * Constantes d'upload de fichiers (#24) — source unique taille + libellé + types.
 * Remplace les valeurs et libellés « 30 MB » dupliqués (ChapterManager).
 */

export const UPLOAD_CONFIG = Object.freeze({
  MAX_FILE_SIZE_BYTES: 30 * 1024 * 1024,
  MAX_FILE_SIZE_LABEL: '30 MB',
})

/** Extensions acceptées par type de contenu (recopie du mapping existant). */
export const ACCEPTED_FILE_TYPES = Object.freeze({
  powerpoint: '.pptx,.ppt',
  word: '.docx,.doc',
  pdf: '.pdf',
})
