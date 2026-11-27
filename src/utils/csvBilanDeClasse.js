/**
 * #683 : le classement d'une classe en CSV, pour Excel en français : UTF-8 avec BOM, séparateur `;`.
 *
 * Chaque cellule est échappée (guillemets doublés), et une cellule qui commence par `=`, `+`, `-`,
 * `@`, une tabulation ou un retour chariot est préfixée d'une apostrophe : un nom d'élève ne doit
 * jamais devenir une formule à l'ouverture (injection CSV). Les nombres restent des nombres, avec
 * la virgule décimale ; une valeur absente reste une cellule VIDE, jamais 0.
 */
const BOM = '﻿'
const SEPARATEUR = ';'
const DEBUT_DE_FORMULE = /^[=+\-@\t\r]/

function cellule(valeur) {
  if (valeur === null || valeur === undefined) return ''
  if (typeof valeur === 'number') return String(valeur).replace('.', ',')

  const texte = String(valeur)
  const neutralise = DEBUT_DE_FORMULE.test(texte) ? `'${texte}` : texte
  return /[";\n\r]/.test(neutralise) || neutralise !== texte ? `"${neutralise.replaceAll('"', '""')}"` : neutralise
}

function ligne(valeurs) {
  return valeurs.map(cellule).join(SEPARATEUR)
}

/** @param {{ matieres: Array<{matiere_id: number, libelle: string|null}>, eleves: Array<object> }} bilan */
export function csvBilanDeClasse(bilan) {
  const matieres = bilan.matieres ?? []
  const entete = ['Rang', 'Élève', 'Moyenne générale', ...matieres.map((m) => m.libelle ?? `Matière ${m.matiere_id}`), 'Notes manquantes']

  const lignes = (bilan.eleves ?? []).map((eleve) => {
    const parMatiere = new Map((eleve.matieres ?? []).map((m) => [m.matiere_id, m.moyenne]))
    return ligne([
      eleve.rang ?? null,
      eleve.nom,
      eleve.moyenne_generale ?? null,
      ...matieres.map((m) => parMatiere.get(m.matiere_id) ?? null),
      (eleve.notes_manquantes ?? []).length,
    ])
  })

  return BOM + [ligne(entete), ...lignes].join('\r\n') + '\r\n'
}
