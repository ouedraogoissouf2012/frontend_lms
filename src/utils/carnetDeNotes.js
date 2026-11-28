import { afficherNote } from '@/utils/studentGrades'

/**
 * #692 (lms_backend#1698) : le carnet de notes d'une classe, lu dans le bilan (`cellules` de chaque
 * ligne : `[{evaluation_id, etat, note}]`, dans l'ordre de `evaluations`).
 *
 * Seule une case `rendu` porte une note ; les autres disent leur état EN TOUTES LETTRES, jamais par
 * une couleur seule. Un état que l'écran ne connaît pas se montre tel quel plutôt que d'être deviné.
 */
export const LIBELLES_DES_ETATS = Object.freeze({
  rendu: 'Rendu',
  a_corriger: 'À corriger',
  en_retard: 'En retard',
  manquant: 'Manquant',
})

export const EXPLICATIONS_DES_ETATS = Object.freeze({
  a_corriger: 'remise, la correction de l’enseignant est attendue',
  en_retard: 'remise refusée après l’échéance, copie verrouillée',
  manquant: 'rien de remis',
})

/** Le bilan porte-t-il un carnet ? Un serveur d'avant lms_backend#1698 n'a pas de `cellules` : rien n'est deviné. */
export function aUnCarnet(bilan) {
  const eleves = bilan?.eleves
  return Array.isArray(eleves) && Array.isArray(bilan?.evaluations) && eleves.every((e) => Array.isArray(e?.cellules))
}

/** La case d'un élève pour une évaluation, `null` si le serveur n'en rend pas. */
export function caseDe(eleve, evaluationId) {
  return (eleve?.cellules ?? []).find((c) => c.evaluation_id === evaluationId) ?? null
}

export function libelleDeLEtat(etat) {
  return LIBELLES_DES_ETATS[etat] ?? String(etat ?? '—')
}

/** Ce que montre une case : la note si elle est rendue, son état sinon. */
export function contenuDeLaCase(cellule) {
  if (!cellule) return '—'
  return afficherNote(cellule.note) // FALSIFICATION : l'état n'est plus dit.
}

/** L'en-tête d'une évaluation : son titre, et sa matière quand le bilan la nomme. */
export function enteteDeLEvaluation(evaluation, matieres) {
  const matiere = (matieres ?? []).find((m) => m.matiere_id === evaluation.matiere_id)
  return { titre: evaluation.titre ?? `Évaluation ${evaluation.id}`, matiere: matiere?.libelle ?? null }
}
