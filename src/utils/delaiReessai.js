/**
 * Le délai d'un nouvel essai, dit à un élève à partir de l'en-tête `Retry-After` (décision de la
 * superviseure : pas de « N s »). Seule la forme « nombre de secondes » est lue ; la forme date HTTP,
 * une valeur absente ou hors bornes (1 à 3600 s) rend « un instant ».
 * À partir de 60 s, le délai s'arrondit à la minute SUPÉRIEURE : l'élève ne réessaie pas trop tôt.
 */

export const SANS_DELAI = 'un instant'

/**
 * @param {*} entete valeur de `Retry-After`
 * @returns {string} « 30 secondes », « 2 minutes », ou « un instant »
 */
export function libelleDelai(entete) {
  const brut = entete == null ? '' : String(entete).trim()
  if (!/^\d+$/.test(brut)) return SANS_DELAI
  const secondes = Number(brut)
  if (secondes < 1 || secondes > 3600) return SANS_DELAI
  if (secondes < 60) return secondes === 1 ? '1 seconde' : `${secondes} secondes`
  const minutes = Math.ceil(secondes / 60)
  return minutes === 1 ? '1 minute' : `${minutes} minutes`
}
