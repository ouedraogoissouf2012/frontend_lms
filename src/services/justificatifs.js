import api from './api'
import { endpoints } from './endpoints'
import { invalidResponseError } from './errorHandler'

/**
 * Les justificatifs d'absence (lms_backend#1681, #687).
 *
 * Élève : ses absences justifiables, ses justificatifs, le dépôt (multipart). Gestion : la file paginée et ses
 * compteurs, valider, rejeter, la pièce (binaire, par le client authentifié : un lien nu n'aurait pas le jeton).
 */
function donnees(response, contexte) {
  if (response?.success !== true) throw invalidResponseError(contexte, response)
  return response.data
}

export const justificatifsService = {
  /** @returns {Promise<Array<{ seance_id: number, titre: ?string, date_seance: ?string, marque: ?string, justificatif_etat: ?string }>>} */
  async mesAbsences() {
    const absences = donnees(await api.get(endpoints.lms.mesAbsences), 'GET mes absences sans success')
    return Array.isArray(absences) ? absences : []
  },

  /** @returns {Promise<Array<Object>>} */
  async mesJustificatifs() {
    const liste = donnees(await api.get(endpoints.lms.mesJustificatifs), 'GET mes justificatifs sans success')
    return Array.isArray(liste) ? liste : []
  },

  /**
   * @param {{ motif: string, seanceIds: number[], piece: ?File }} depot
   * @returns {Promise<Object>} le justificatif déposé
   */
  async deposer({ motif, seanceIds, piece }) {
    const form = new FormData()
    form.append('motif', motif)
    for (const id of seanceIds) form.append('seance_ids[]', String(id))
    if (piece) form.append('piece', piece)
    // Le multipart porte sa « boundary », que seul le navigateur calcule : l'en-tête JSON par défaut d'`api` est
    // retiré (patron d'importPreview.js).
    const response = await api.post(endpoints.lms.justificatifs.store, form, { headers: { 'Content-Type': null } })
    return donnees(response, 'POST justificatif sans success')
  },

  /**
   * @param {{ etat: string, page: number }} filtres
   * @returns {Promise<{ justificatifs: Array<Object>, compteurs: Object, page: number, derniere_page: number, total: number }>}
   */
  async lister({ etat, page }) {
    return donnees(await api.get(endpoints.lms.justificatifs.index, { params: { etat, page } }), 'GET justificatifs sans success')
  },

  /** @param {number} id */
  async valider(id) {
    return donnees(await api.post(endpoints.lms.justificatifs.valider(id)), 'POST valider sans success')
  },

  /** @param {number} id @param {string} motif */
  async rejeter(id, motif) {
    return donnees(await api.post(endpoints.lms.justificatifs.rejeter(id), { motif }), 'POST rejeter sans success')
  },

  /**
   * @param {number} id
   * @returns {Promise<Blob>}
   */
  piece(id) {
    return api.get(endpoints.lms.justificatifs.piece(id), { responseType: 'blob' })
  },
}
