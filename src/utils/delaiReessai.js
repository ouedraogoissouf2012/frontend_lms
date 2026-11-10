/**
 * Le délai d'un nouvel essai, dit à un élève à partir de l'en-tête `Retry-After` (décisions de la
 * superviseure : pas de « N s »). Seule la forme « nombre de secondes » est lue.
 * - moins d'une minute : « dans 30 secondes » ;
 * - de 60 s à 60 min : la minute SUPÉRIEURE (« dans 2 minutes ») ;
 * - au-delà de 60 min : l'heure SUPÉRIEURE (« dans 2 heures ») ;
 * - au-delà de 24 h : « plus tard ».
 * « Dans un instant » est réservé à un délai absent ou illisible (forme date HTTP, nul, négatif, non
 * entier) : un long délai ne doit pas pousser à réessayer trop tôt.
 */

export const SANS_DELAI = 'dans un instant'

const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`

/**
 * @param {*} entete valeur de `Retry-After`
 * @returns {string} « dans 30 secondes », « dans 2 heures », « plus tard », ou « dans un instant »
 */
export function libelleDelai(entete) {
  const brut = entete == null ? '' : String(entete).trim()
  if (!/^\d+$/.test(brut)) return SANS_DELAI
  const secondes = Number(brut)
  if (secondes < 1) return SANS_DELAI
  if (secondes < 60) return `dans ${pluriel(secondes, 'seconde')}`
  if (secondes <= 3600) return `dans ${pluriel(Math.ceil(secondes / 60), 'minute')}`
  if (secondes <= 86400) return `dans ${pluriel(Math.ceil(secondes / 3600), 'heure')}`
  return 'plus tard'
}
