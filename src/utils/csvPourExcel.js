/**
 * #683, #692 : un document CSV pour Excel en français : UTF-8 avec BOM, séparateur `;`, lignes en CRLF.
 *
 * Chaque cellule est échappée (guillemets doublés), et une cellule qui commence par `=`, `+`, `-`,
 * `@`, une tabulation ou un retour chariot est préfixée d'une apostrophe : un nom d'élève ne doit
 * jamais devenir une formule à l'ouverture (injection CSV). Les nombres restent des nombres, avec
 * la virgule décimale ; une valeur absente reste une cellule VIDE, jamais 0.
 */
const BOM = '\uFEFF'
const SEPARATEUR = ';'
const DEBUT_DE_FORMULE = /^[=+\-@\t\r]/

function cellule(valeur) {
  if (valeur === null || valeur === undefined) return ''
  if (typeof valeur === 'number') return String(valeur).replace('.', ',')

  const texte = String(valeur)
  const neutralise = DEBUT_DE_FORMULE.test(texte) ? `'${texte}` : texte
  return /[";\n\r]/.test(neutralise) || neutralise !== texte ? `"${neutralise.replaceAll('"', '""')}"` : neutralise
}

/** @param {Array<Array<unknown>>} lignes la première est l'en-tête */
export function documentCsv(lignes) {
  return BOM + lignes.map((valeurs) => valeurs.map(cellule).join(SEPARATEUR)).join('\r\n') + '\r\n'
}
