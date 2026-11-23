// #618 : les ids LOCAUX d'une leçon de l'école KLASSCI, lus sur la page de la matière (`GET /lms/matieres/{id}`,
// MatiereDetailsQueryService::localContext), comme le front (#749 : `matiere_id_local` ; #740 : `classes_concernees`).
// Depuis lms_backend#1266, POST /lessons n'accepte que l'id local de la classe : l'id KLASSCI rend 403.
// Une lecture absente ou ambiguë est un manque NOMMÉ : jamais un id deviné.

/**
 * @param {{ classes_concernees?: Array<{ id: number, nom: string }>, matiere_id_local?: number|null }|null} page
 * @param {string} nomClasse - le nom de la classe visée (celui du jeu du faux KLASSCI)
 * @param {number} matiere - l'id KLASSCI de la matière, pour nommer le manque
 * @returns {{ classe_id: number, matiere_id?: number } | { manque: string }}
 */
export function idsLocauxDeLecon(page, nomClasse, matiere) {
  if (!Array.isArray(page?.classes_concernees)) return { manque: `page de la matière ${matiere} sans classes_concernees` }
  const classes = page.classes_concernees.filter((c) => c.nom === nomClasse)
  if (classes.length === 0) return { manque: `classe « ${nomClasse} » absente de classes_concernees de la matière ${matiere}` }
  if (classes.length > 1) return { manque: `classe « ${nomClasse} » en ${classes.length} exemplaires dans classes_concernees de la matière ${matiere}` }
  // Matière non miroitée : `null`, et le front omet alors le champ (MatiereDetailsQueryService).
  return { classe_id: classes[0].id, ...(page.matiere_id_local != null && { matiere_id: page.matiere_id_local }) }
}
