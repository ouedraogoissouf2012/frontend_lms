/**
 * Des EXEMPLES construits depuis la forme MESURÉE des réponses KLASSCI (`formes-mesurees.json` : cache de la base de
 * DEV, 22/09/2026, clés et types seuls, D582, D584).
 *
 * Ce module ne contient aucune charge écrite de mémoire : chaque clé d'un exemple est une clé MESURÉE, et seules les
 * valeurs sont fabriquées, par type (`1`, `'x'`, `true`). Un test qui veut la forme d'une route sans capture complète
 * (la liste `GET evaluations`, qui n'a pas `can_submit_notes`) la prend ici. Il remplace les valeurs dont il a besoin.
 */
import formes from './formes-mesurees.json'

const VALEURS = { int: 1, float: 1.5, string: 'x', bool: true, null: null }

/**
 * L'exemple d'une route, à partir d'un chemin de sa forme.
 * @param {string} route - par exemple 'GET /evaluations'
 * @param {string} racine - par exemple '$.data[]' (un élément de la liste)
 */
export function exempleMesure(route, racine) {
  const chemins = formes.routes[route]?.chemins
  if (!chemins || !(racine in chemins)) throw new Error(`forme non mesurée : ${route} ${racine}`)
  const valeur = (chemin) => {
    const type = chemins[chemin].split('|').find((t) => t !== 'null') ?? 'null'
    if (type === 'list') return `${chemin}[]` in chemins ? [valeur(`${chemin}[]`)] : []
    if (type !== 'object') return VALEURS[type]
    const objet = {}
    for (const c of Object.keys(chemins)) {
      const champ = c.startsWith(`${chemin}.`) ? c.slice(chemin.length + 1) : null
      if (champ && /^[A-Za-z_][A-Za-z0-9_]*$/.test(champ)) objet[champ] = valeur(c)
    }
    return objet
  }
  return valeur(racine)
}
