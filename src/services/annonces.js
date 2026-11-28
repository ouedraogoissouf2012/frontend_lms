import api from './api'
import { endpoints } from './endpoints'
// Relatif, pas `@/` : ce service est dans le graphe du runner de contrat natif.

/** Une page de « Mes annonces » : assez pour un fil lisible, loin du plafond serveur (100). */
export const ANNONCES_PAR_PAGE = 20

/**
 * Annonce à toute une classe (#690, lms#1650), `POST /annonces`.
 * @param {{ classeId: number, titre: string, message: string }} annonce `classeId` : l'id de l'ESPACE SOURCE de
 *   l'école (`idEspaceSource` de la fiche de classe), jamais deviné
 * @returns {Promise<object>} le corps de la réponse (`{ data: { id, classe_id, titre, destinataires, courriel } }`)
 */
export async function publierAnnonce({ classeId, titre, message }) {
  return api.post(endpoints.annonces.publier, { classe_id: classeId, titre, message })
}

/**
 * Une page des annonces de l'appelant (#690), filtrées par le SERVEUR : `GET /notifications?type=annonce`. Filtrer à
 * l'écran une page de toutes les notifications perdrait les annonces des pages suivantes.
 * @param {number} page
 * @returns {Promise<object>} `{ data: [notification], meta: { current_page, last_page, per_page, total } }`
 * @throws l'erreur normalisée du client HTTP : une panne n'est jamais une liste vide
 */
export async function lireMesAnnonces(page) {
  // SONDE front#690 : le filtre par type n'est plus envoye au serveur.
  return api.get(endpoints.notifications.list, { params: { page, per_page: ANNONCES_PAR_PAGE } })
}
