import api from './api'
import { endpoints } from './endpoints'
import { invalidResponseError } from './errorHandler'

/**
 * Les classes de l'établissement, `{ id, libelle }`, par leur id LOCAL dans les deux volets
 * (lms_backend#1709, `GET /lms/classes/etablissement`).
 *
 * C'est l'identifiant qu'attend le filtre `classe_id` du rapport de présences. Le catalogue
 * KLASSCI (`/proxy/classes`) donne, dans une école KLASSCI, des ids d'un autre espace : le
 * filtre visait alors une autre classe (D41). Il ne sert donc jamais ici.
 *
 * La liste est paginée par le serveur (100 au plus par page, spec #548) : toutes les pages
 * sont lues, sous une borne qui empêche une réponse incohérente de boucler sans fin.
 */
export const PAR_PAGE = 100
export const PAGES_MAX = 50

export async function listerClassesDeLEtablissement() {
  const classes = []
  for (let page = 1; page <= PAGES_MAX; page += 1) {
    const corps = await api.get(endpoints.lms.classes.etablissement, { params: { page, per_page: PAR_PAGE } })
    if (!Array.isArray(corps?.data)) throw invalidResponseError('classes de l’établissement', corps)
    for (const { id, libelle } of corps.data) classes.push({ id, libelle })
    if (page >= (corps.meta?.last_page ?? 1)) return classes
  }
  return classes
}
