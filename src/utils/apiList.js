/**
 * Extrait un tableau d'items d'une réponse API, quelle que soit la forme
 * d'enveloppe (#232 ; atténue la dette d'enveloppe non uniforme, cf. #522) :
 *
 *  - paginée Laravel : `{ success, data: { data: [...], current_page, total } }`
 *    → renvoie `response.data.data`
 *  - plate           : `{ success, data: [...] }` → renvoie `response.data`
 *  - déjà un tableau : `[...]` → renvoyé tel quel (défensif)
 *  - toute autre forme / null → `[]`
 *  - named keys (optionnel) : `{ classes: [...] }` ou `{ data: { classes: [...] } }`
 *
 * L'intercepteur axios renvoie déjà le CORPS (`response.data`), donc `response`
 * ici est `{ success, data, meta? }`.
 *
 * @param {*} response
 * @param {string[]} [keys]
 * @returns {Array<*>}
 */
export function extractList(response, keys = []) {
  if (Array.isArray(response)) {
    return response
  }

  const payload = response?.data

  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  for (const key of keys) {
    if (Array.isArray(response?.[key])) return response[key]
    if (Array.isArray(payload?.[key])) return payload[key]
  }

  return []
}

/**
 * Lit le PREMIER champ tableau parmi `keys` dans un OBJET donné.
 *
 * C'est une LECTURE DE CHAMP, distincte du dé-wrap d'enveloppe d'`extractList`
 * (#296 : `extractList` mélangeait ces deux opérations via son paramètre `keys`).
 * À utiliser quand `source` est déjà une entité (ex. la forme enseignant du
 * dashboard : `pickList(enseignant, ['matieres'])`), PAS une réponse à dé-wrapper.
 *
 * @param {*} source Objet source (pas une réponse d'API).
 * @param {string[]} keys Clés candidates, par ordre de précédence.
 * @param {Array<*>} [fallback] Retour si aucune clé n'est un tableau.
 * @returns {Array<*>}
 */
export function pickList(source, keys, fallback = []) {
  if (source && typeof source === 'object') {
    for (const key of keys) {
      if (Array.isArray(source[key])) return source[key]
    }
  }
  return fallback
}
