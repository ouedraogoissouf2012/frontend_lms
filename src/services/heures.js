import api from './api'
import { endpoints } from './endpoints'
import { invalidResponseError } from './errorHandler'

/**
 * Les heures des enseignants (lms_backend#1682, #688) : l'historique d'un mois de l'enseignant, le rapport de la
 * gestion et son export CSV (binaire, par le client authentifié : un lien nu n'aurait pas le jeton).
 */
function donnees(response, contexte) {
  if (response?.success !== true) throw invalidResponseError(contexte, response)
  return response.data
}

export const heuresService = {
  /**
   * @param {string} mois AAAA-MM
   * @returns {Promise<{ mois: string, depuis: ?string, seances: Array<Object>, totaux: { minutes: number, comptees: number, non_comptees: number } }>}
   */
  async mesHeures(mois) {
    return donnees(await api.get(endpoints.lms.mesHeures, { params: { mois } }), 'GET mes heures sans success')
  },

  /**
   * @param {Object} params du, au, et les filtres posés
   * @returns {Promise<{ du: string, au: string, depuis: ?string, enseignants: Array<Object> }>}
   */
  async rapport(params) {
    return donnees(await api.get(endpoints.lms.heuresEnseignants, { params }), 'GET heures des enseignants sans success')
  },

  /**
   * @param {Object} params du, au, et les filtres posés
   * @returns {Promise<Blob>}
   */
  exporter(params) {
    return api.get(endpoints.lms.heuresEnseignants, { params: { ...params, format: 'csv' }, responseType: 'blob' })
  },
}
