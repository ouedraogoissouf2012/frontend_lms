import { coalesceNumber } from './coalesceNumber'

/**
 * Somme de mesures, ou `null` si UNE seule manque.
 *
 * Règle commune des tableaux de bord : un total n'est donné que si chaque terme a été
 * mesuré. Une somme partielle passerait pour le total (« Total utilisateurs » valait les
 * enseignants seuls quand l'effectif étudiant manquait), et « non mesuré » ne vaut jamais 0.
 * Une liste vide, réellement obtenue, vaut 0.
 *
 * @param {Array<*>} values - nombres, chaînes numériques, ou valeurs absentes
 * @returns {number|null}
 */
export function measuredSum(values) {
  const nombres = values.map((v) => coalesceNumber([v]))
  return nombres.every((n) => n !== null) ? nombres.reduce((s, n) => s + n, 0) : null
}
