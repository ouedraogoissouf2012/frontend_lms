import { documentCsv } from '@/utils/csvPourExcel'
import { caseDe, enteteDeLEvaluation, libelleDeLEtat } from '@/utils/carnetDeNotes'

/**
 * #692 : le carnet de notes d'une classe en CSV (règles de {@link documentCsv}). Une colonne par
 * évaluation, dans l'ordre du bilan : la note d'une case rendue reste un NOMBRE ; une case sans
 * note porte son état en toutes lettres (« À corriger », « En retard », « Manquant »), jamais 0.
 */
export function csvCarnetDeNotes(bilan) {
  const evaluations = bilan.evaluations ?? []
  const entete = ['Élève', 'Moyenne générale', ...evaluations.map((ev) => {
    const { titre, matiere } = enteteDeLEvaluation(ev, bilan.matieres)
    return matiere ? `${titre} (${matiere})` : titre
  })]

  const lignes = (bilan.eleves ?? []).map((eleve) => [
    eleve.nom,
    eleve.moyenne_generale ?? null,
    ...evaluations.map((ev) => {
      const cellule = caseDe(eleve, ev.id)
      if (!cellule) return null
      return cellule.etat === 'rendu' ? (cellule.note ?? null) : libelleDeLEtat(cellule.etat)
    }),
  ])

  return documentCsv([entete, ...lignes])
}
