import { documentCsv } from '@/utils/csvPourExcel'

/**
 * #683 : le classement d'une classe en CSV, pour Excel en français (règles de {@link documentCsv} :
 * BOM, `;`, virgule décimale, formules neutralisées, valeur absente = cellule vide).
 */

/** @param {{ matieres: Array<{matiere_id: number, libelle: string|null}>, eleves: Array<object> }} bilan */
export function csvBilanDeClasse(bilan) {
  const matieres = bilan.matieres ?? []
  const entete = ['Rang', 'Élève', 'Moyenne générale', ...matieres.map((m) => m.libelle ?? `Matière ${m.matiere_id}`), 'Notes manquantes']

  const lignes = (bilan.eleves ?? []).map((eleve) => {
    const parMatiere = new Map((eleve.matieres ?? []).map((m) => [m.matiere_id, m.moyenne]))
    return [
      eleve.rang ?? null,
      eleve.nom,
      eleve.moyenne_generale ?? null,
      ...matieres.map((m) => parMatiere.get(m.matiere_id) ?? null),
      (eleve.notes_manquantes ?? []).length,
    ]
  })

  return documentCsv([entete, ...lignes])
}
