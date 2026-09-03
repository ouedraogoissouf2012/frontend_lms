/**
 * Clés candidates d'identité KLASSCI, par ordre de précédence. UNE seule source
 * (#296) : `toId` (retient la 1re clé présente) ET `byId` (`evaluationDisplay.js`,
 * indexe par toutes) la partagent — impossible de diverger comme avant, où `byId`
 * avait oublié `class_id`.
 */
export const ENTITY_ID_KEYS = Object.freeze([
  'id',
  'klassci_id',
  'teacher_id',
  'enseignant_id',
  'user_id',
  'professeur_id',
  'classe_id',
  'class_id',
  'matiere_id',
])

/**
 * Normalise une valeur d'id KLASSCI en chaîne canonique (number|string → String).
 * Pour un objet, retient la 1re clé d'identité présente (cf. `ENTITY_ID_KEYS`).
 * @param {*} value
 * @returns {string}
 */
export function toId(value) {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'object') {
    // Équivalent exact au `a ?? b ?? …` d'origine : 1re clé non null/undefined
    // (une chaîne vide compte comme présente et retombe sur '' via la récursion).
    for (const key of ENTITY_ID_KEYS) {
      const candidate = value[key]
      if (candidate !== null && candidate !== undefined) return toId(candidate)
    }
    return ''
  }
  return String(value)
}
