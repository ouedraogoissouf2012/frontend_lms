/**
 * Couples classe × matière d'une école créée depuis le LMS, lus sur le catalogue `/proxy/matieres`.
 *
 * Règle d'origine (D172) : seule une carte qui porte `source: 'lms_local'` (B-source) a des ids LOCAUX
 * qu'on peut envoyer sous `classe_id` / `matiere_id`. Une carte sans cette marque vient de KLASSCI :
 * ses ids ne partent jamais sous un nom local (D132). Le couple se prend sur la MÊME carte : la classe
 * est une de celles de la matière choisie.
 */

/** Les cartes de matière d'origine locale. */
export function matieresLocales(matieres) {
  return Array.isArray(matieres) ? matieres.filter((m) => m?.source === 'lms_local') : []
}

/** Les classes de la carte de matière `matiereId` (parmi les cartes données), ou []. */
export function classesDeLaMatiere(matieres, matiereId) {
  const carte = Array.isArray(matieres) ? matieres.find((m) => m?.id === matiereId) : null
  return Array.isArray(carte?.classes) ? carte.classes : []
}
