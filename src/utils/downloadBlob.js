/**
 * Téléchargement d'un contenu généré côté client (#334).
 *
 * Quatre copies quasi identiques de ces six lignes existaient déjà
 * (attendanceExport, useEvaluationCorrections, useAdminEvaluationDetails,
 * GenerateReportModal) ; la cinquième, écrite pour le modèle CSV d'import,
 * oubliait d'insérer l'ancre dans le document — or un `click()` sur une ancre
 * détachée ne déclenche pas le téléchargement partout.
 *
 * Source unique ici. Les quatre copies existantes ne sont pas migrées dans ce
 * lot (hors périmètre) : dette tracée, à reprendre quand on touchera à ces
 * écrans.
 */

/**
 * Propose le contenu au téléchargement sous le nom donné.
 *
 * @param {Blob} blob - Contenu à télécharger.
 * @param {string} filename - Nom de fichier proposé.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'

  // L'ancre DOIT être dans le document : détachée, le clic reste sans effet
  // sur plusieurs navigateurs.
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
