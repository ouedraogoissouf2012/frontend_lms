import api from './api'
import { endpoints } from './endpoints'
import { invalidResponseError } from './errorHandler'

/**
 * L'émargement par code d'une séance en ligne (lms_backend#1680, #335).
 *
 * Personnel : générer (le code en clair rendu UNE fois), lister avec les statistiques, révoquer. Élève : signer.
 * Le code circule en clair (il se dicte, il s'affiche en QR) : ce module ne le journalise jamais.
 */
function donnees(response, contexte) {
  if (response?.success !== true) throw invalidResponseError(contexte, response)
  return response.data
}

export const emargementService = {
  /**
   * @param {number} seanceId
   * @param {{ dureeMinutes: number, retardApresMinutes: ?number }} options
   * @returns {Promise<{ id: number, code: string, expire_le: string }>}
   */
  async generer(seanceId, { dureeMinutes, retardApresMinutes }) {
    const response = await api.post(endpoints.lms.codesEmargement.store, {
      seance_id: seanceId,
      duree_minutes: dureeMinutes,
      retard_apres_minutes: retardApresMinutes,
    })
    return donnees(response, 'POST code d’émargement sans success')
  },

  /**
   * @param {number} seanceId
   * @returns {Promise<Array<{ id: number, expire_le: string, revoque_le: ?string, valable: boolean, signatures: number, attendus: number, taux: number }>>}
   */
  async lister(seanceId) {
    const response = await api.get(endpoints.lms.codesEmargement.index, { params: { seance_id: seanceId } })
    const codes = donnees(response, 'GET codes d’émargement sans success')
    return Array.isArray(codes) ? codes : []
  },

  /** @param {number} codeId */
  async revoquer(codeId) {
    const response = await api.delete(endpoints.lms.codesEmargement.destroy(codeId))
    if (response?.success !== true) throw invalidResponseError('DELETE code d’émargement sans success', response)
  },

  /**
   * @param {string} code déjà normalisé
   * @returns {Promise<{ seance_id: number, mark: string, deja_signe: boolean }>}
   */
  async signer(code) {
    const response = await api.post(endpoints.lms.emargement, { code })
    return donnees(response, 'POST émargement sans success')
  },
}
