// D584 : la FORME d'une réponse (chemins et types, jamais les valeurs), et ses écarts à une forme MESURÉE.
//
// Les conventions sont celles du relevé de la forme réelle (cache KLASSCI de la base de DEV, D582), pour comparer
// à l'identique : `$` est la racine, `.cle` un champ, `[]` un élément de liste (tous les éléments fusionnés), `{n}`
// une clé numérique ; les types sont null, bool, int, float, string, list, object.

function typeDe(v) {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'list'
  if (typeof v === 'boolean') return 'bool'
  if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'float'
  if (typeof v === 'string') return 'string'
  return typeof v === 'object' ? 'object' : 'autre'
}

/** @returns {Map<string, Set<string>>} chemin → types rencontrés */
export function formeDe(valeur) {
  const formes = new Map()
  const parcourir = (v, chemin) => {
    if (!formes.has(chemin)) formes.set(chemin, new Set())
    formes.get(chemin).add(typeDe(v))
    if (Array.isArray(v)) v.forEach((e) => parcourir(e, `${chemin}[]`))
    else if (v && typeof v === 'object') {
      for (const [k, e] of Object.entries(v)) parcourir(e, `${chemin}.${/^\d+$/.test(k) ? '{n}' : k}`)
    }
  }
  parcourir(valeur, '$')
  return formes
}

/**
 * Ce que le faux sert HORS de la forme mesurée : un chemin absent du réel (une clé INVENTÉE), ou un type que le
 * réel n'a jamais porté. Ce que le réel porte en plus n'est pas un écart : le faux peut omettre, jamais inventer.
 * @param {Map<string, Set<string>>} faux
 * @param {Record<string, string>} mesuree - chemin → types séparés par `|` (formes-mesurees.json)
 * @returns {string[]}
 */
export function ecartsDeForme(faux, mesuree) {
  const ecarts = []
  for (const [chemin, types] of faux) {
    if (!(chemin in mesuree)) { ecarts.push(`inventé : ${chemin}`); continue }
    const reels = new Set(mesuree[chemin].split('|'))
    const hors = [...types].filter((t) => !reels.has(t))
    if (hors.length) ecarts.push(`type : ${chemin} (faux ${hors.join('|')}, réel ${mesuree[chemin]})`)
  }
  return ecarts
}
