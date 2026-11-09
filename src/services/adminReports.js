import api from './api'
import { endpoints } from './endpoints'
import { invalidResponseError } from './errorHandler'
import { REPORT_STATUS } from '../constants/reports'

/**
 * Rapports PDF globaux, ASYNCHRONES depuis D10 (spec #991).
 *
 * `POST /admin/reports/{type}` rend 202 `RapportAccepte` : un id à suivre, pas le
 * fichier. Le fichier se télécharge une fois le statut `completed`.
 *
 * NOTE intercepteur : api.js retourne déjà response.data (le CORPS).
 */

// Un id sûr à placer dans un chemin (la spec annonce un UUID).
const ID_SUR = /^[A-Za-z0-9-]{1,64}$/
const STATUTS = new Set(Object.values(REPORT_STATUS))

/**
 * Vérifie un `RapportAccepte`. Le `status_url` doit désigner CE rapport : on
 * construit nos chemins depuis l'id, mais un serveur qui en annoncerait un autre
 * signale une réponse que l'on ne comprend pas — on s'arrête (fail-secure).
 */
function idAccepte(corps) {
  const donnees = corps?.success === true ? corps.data : null
  const id = donnees?.id
  if (typeof id !== 'string' || !ID_SUR.test(id)) return null
  if (donnees.status !== REPORT_STATUS.PENDING) return null
  if (typeof donnees.status_url !== 'string' || !donnees.status_url.endsWith(`/admin/reports/async/${id}`)) return null
  return id
}

export const adminReportsService = {
  /**
   * Demande un rapport.
   * @param {'attendance'|'grades'|'activity'} type
   * @param {Record<string, string>} filtres champs acceptés par la route
   * @returns {Promise<string>} l'id du rapport à suivre
   */
  async demander(type, filtres, { signal } = {}) {
    if (!Object.prototype.hasOwnProperty.call(endpoints.admin.reports, type)) throw invalidResponseError(`type de rapport inconnu (${type})`)
    const id = idAccepte(await api.post(endpoints.admin.reports[type], filtres, { signal }))
    if (!id) throw invalidResponseError('demande de rapport')
    return id
  },

  /**
   * État d'un rapport (`RapportSuivi`).
   * @returns {Promise<{ status: string, filename?: string }>}
   */
  async suivre(id, { signal } = {}) {
    if (!ID_SUR.test(String(id))) throw invalidResponseError('identifiant de rapport')
    const corps = await api.get(endpoints.admin.reportsAsync.status(id), { signal })
    const donnees = corps?.success === true ? corps.data : null
    if (!donnees || !STATUTS.has(donnees.status)) throw invalidResponseError('suivi de rapport')
    return donnees
  },

  /** Le PDF d'un rapport terminé. Avant : 409. */
  async telecharger(id, { signal } = {}) {
    if (!ID_SUR.test(String(id))) throw invalidResponseError('identifiant de rapport')
    return api.get(endpoints.admin.reportsAsync.download(id), { responseType: 'blob', signal })
  },
}

export default adminReportsService
