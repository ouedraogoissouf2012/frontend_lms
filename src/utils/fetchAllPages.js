import { extractList } from './apiList'

// Garde-fou : au-delà de ce nombre de pages, la liste est rendue marquée `incomplete`.
const MAX_PAGES = 50

/**
 * TOUS les éléments d'une liste paginée par Laravel (`data.data`, `data.last_page`),
 * page après page.
 *
 * Un refus en cours de route (`success: false`) est rendu tel quel : jamais une liste
 * partielle présentée comme complète. Une réponse non paginée (liste plate) est rendue
 * après le premier appel.
 *
 * @param {(params: Object) => Promise<Object>} fetchPage - appel d'UNE page
 * @param {Object} params - filtres de l'appelant
 * @param {number} pageSize - taille de page demandée (borne du serveur)
 * @returns {Promise<{ success: boolean, data: Array, incomplete?: boolean }>}
 */
export async function fetchAllPages(fetchPage, params, pageSize) {
  const tous = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await fetchPage({ ...params, per_page: pageSize, page })
    if (!response?.success) return response
    tous.push(...extractList(response))
    const derniere = Number(response.data?.last_page)
    if (!Number.isFinite(derniere) || page >= derniere) return { ...response, data: tous }
  }
  return { success: true, data: tous, incomplete: true }
}
