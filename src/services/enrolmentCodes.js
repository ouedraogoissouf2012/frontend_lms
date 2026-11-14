import api from './api'
import { endpoints } from './endpoints'

/**
 * Code d'inscription d'une classe locale (#391, ADR-803-03).
 *
 * Personnel : lister les classes locales et leur code, émettre (remplace l'ancien),
 * retirer (ferme la porte sans désinscrire personne). Élève : rejoindre par code.
 * Chemins de la spec du backend, SANS préfixe /lms.
 *
 * Le code circule EN CLAIR (il se dicte) : ce module ne le journalise jamais.
 */

/**
 * C43 (D425) : « rejoint » (201) et « déjà inscrit » (200) ne diffèrent que par le STATUT, que
 * l'intercepteur ne rend pas (il rend `response.data`). Relevé ici, pour cette requête seule, et
 * SEULEMENT sur un 2xx : axios applique aussi `transformResponse` aux réponses d'erreur, dont le
 * corps (et son `reason`) doit rester intact pour le catalogue.
 */
function avecStatut(data, headers, status) {
  return status >= 200 && status < 300 ? { corps: data, statut: status } : data
}

export const enrolmentCodesService = {
  listClasses(page = 1) {
    return api.get(endpoints.enrolment.classes, { params: { page, per_page: 25 } })
  },

  emettre(classeId) {
    return api.post(endpoints.enrolment.code(classeId))
  },

  retirer(classeId) {
    return api.delete(endpoints.enrolment.code(classeId))
  },

  /** Rend le corps et `dejaInscrit` (clé du FRONT, jamais émise ni renvoyée au serveur). */
  async rejoindre(code) {
    const { corps, statut } = await api.post(endpoints.enrolment.rejoindre, { code }, {
      transformResponse: [...[].concat(api.defaults.transformResponse ?? []), avecStatut],
    })
    return { ...corps, dejaInscrit: statut === 200 }
  },
}
