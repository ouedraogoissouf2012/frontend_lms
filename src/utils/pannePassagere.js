/**
 * Une erreur est-elle une PANNE PASSAGÈRE, qu'un nouvel essai peut lever ?
 *
 * Liste d'AUTORISATION : un 5xx, un 429 (trop de requêtes), ou aucune réponse (réseau coupé, délai
 * dépassé). Tout autre statut (400, 401, 403, 404, 409, 422…) est un refus que réessayer ne changera
 * pas : l'écran ne doit pas offrir « Réessayer » (constat E2E : l'élève à l'inscription inactive
 * cliquait sans fin sur un 404). Sans erreur à juger, on laisse l'utilisateur réessayer. Une erreur
 * marquée `definitif` (réponse 2xx « success: false », cf. userError) est un refus.
 *
 * @param {*} error - erreur rejetée par le client HTTP (axios, après l'intercepteur)
 * @returns {boolean}
 */
export function estPannePassagere(error) {
  // Refus explicite du front (userError … { definitif: true }) : sans réponse, mais pas une panne.
  if (error?.definitif === true) return false
  const status = error?.response?.status
  if (typeof status !== 'number') return true
  return status >= 500 || status === 429
}
