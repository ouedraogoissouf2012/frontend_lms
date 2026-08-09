/**
 * Extrait un tableau d'items d'une réponse API, quelle que soit la forme
 * d'enveloppe (#232 ; atténue la dette d'enveloppe non uniforme, cf. #522) :
 *
 *  - paginée Laravel : `{ success, data: { data: [...], current_page, total } }`
 *    → renvoie `response.data.data`
 *  - plate           : `{ success, data: [...] }` → renvoie `response.data`
 *  - déjà un tableau : `[...]` → renvoyé tel quel (défensif)
 *  - toute autre forme / null → `[]`
 *
 * L'intercepteur axios renvoie déjà le CORPS (`response.data`), donc `response`
 * ici est `{ success, data, meta? }`.
 *
 * @param {*} response
 * @returns {Array<*>}
 */
export function extractList(response) {
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

  return []
}
