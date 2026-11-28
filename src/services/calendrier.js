import api from './api'
import { endpoints } from './endpoints'
import { invalidResponseError } from './errorHandler'

/**
 * Le calendrier de l'année d'une école (#678, contrat lms_backend#1671, docs/openapi.yaml « Calendrier »).
 *
 *   - `lire({ du, au })` : tout membre de l'école, dans sa portée ; la plage est exigée (400 jours au plus) ;
 *   - `publier`, `modifier`, `supprimer` : la gestion seule (403 sinon, le serveur fait foi) ;
 *   - un événement : `{ id, type, titre, debut, fin, portee: ecole|classes, classe_ids }`. `classeIds` vide veut dire
 *     « toute l'école ». Les ids de classe sont LOCAUX (`/lms/classes/etablissement`), dans les deux volets.
 * Un succès que le serveur ne prouve pas (sans l'objet attendu) n'est pas cru.
 */
const estEvenement = (e) => Number.isInteger(e?.id) && typeof e?.debut === 'string' && typeof e?.fin === 'string' && Array.isArray(e?.classe_ids)

function evenementOuErreur(response, contexte) {
  if (response?.success !== true || !estEvenement(response.data)) throw invalidResponseError(contexte, response)
  return response.data
}

const corps = ({ type, titre, debut, fin, classeIds }) => ({
  type,
  titre: String(titre ?? '').trim(),
  debut,
  fin,
  classe_ids: Array.isArray(classeIds) ? classeIds : [],
})

export const calendrierService = {
  async lire({ du, au }) {
    const response = await api.get(endpoints.calendrier.liste, { params: { du, au } })
    if (response?.success !== true || !Array.isArray(response.data)) throw invalidResponseError('GET calendrier sans liste', response)
    return response.data.filter(estEvenement)
  },

  async publier(saisie) {
    return evenementOuErreur(await api.post(endpoints.calendrier.liste, corps(saisie)), 'POST calendrier sans evenement relisible')
  },

  async modifier(id, saisie) {
    return evenementOuErreur(await api.put(endpoints.calendrier.un(id), corps(saisie)), 'PUT calendrier sans evenement relisible')
  },

  async supprimer(id) {
    const response = await api.delete(endpoints.calendrier.un(id))
    if (response?.success !== true) throw invalidResponseError('DELETE calendrier sans succes', response)
    return response
  },
}
