import qrcode from 'qrcode-generator'

/**
 * Le QR d'un code d'émargement (#335) : il mène à la page de l'élève, code pré-rempli. L'élève qui suit la visio sur
 * un ordinateur le scanne avec son téléphone ; celui qui n'a pas de téléphone saisit le code, affiché en grand à côté.
 *
 * La bibliothèque est isolée ici : en changer ne touche aucun composant.
 */

/** Cellules de 4 px, marge de 4 cellules (zone de silence de la norme). */
const TAILLE_CELLULE = 4
const MARGE = 4

/**
 * @param {string} code
 * @returns {string} l'adresse de la page de l'élève, code pré-rempli
 */
export function lienDEmargement(code) {
  return `${window.location.origin}/student/emargement?code=${encodeURIComponent(code)}`
}

/**
 * @param {string} lien
 * @returns {string} une image (data URL GIF) du QR ; correction d'erreur « M » (15 %), taille choisie au plus juste
 */
export function qrDuLien(lien) {
  const qr = qrcode(0, 'M')
  qr.addData(lien)
  qr.make()
  return qr.createDataURL(TAILLE_CELLULE, MARGE)
}
