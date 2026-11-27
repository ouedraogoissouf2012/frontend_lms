import api from './api'
import { endpoints } from './endpoints'
import { invalidResponseError } from './errorHandler'

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

  /**
   * #631 : règle la capacité d'une classe locale. `effectif` est TOUJOURS envoyé, nul compris
   * (le back l'exige) : `null` ou 0 retire la limite. Un succès non déclaré n'est pas cru.
   */
  async reglerCapacite(classeId, effectif) {
    const response = await api.put(endpoints.enrolment.capacite(classeId), { effectif })
    if (response?.success !== true) throw invalidResponseError('PUT capacité sans success', response)
    return response
  },

  /**
   * #657 : rattache la classe à une période (`training_session_id`), ou l'en détache (`null`).
   * La clé est EXIGÉE par le serveur, nulle comprise ; il relit la période et refuse en 422 celle qui ne
   * reçoit plus d'inscriptions.
   */
  async rattacherPeriode(classeId, trainingSessionId) {
    const response = await api.put(endpoints.enrolment.periode(classeId), { training_session_id: trainingSessionId })
    if (response?.success !== true) throw invalidResponseError('PUT période sans success', response)
    return response
  },

  /** Rend le corps et `dejaInscrit` (clé du FRONT, jamais émise ni renvoyée au serveur). */
  async rejoindre(code) {
    const { corps, statut } = await api.post(endpoints.enrolment.rejoindre, { code }, {
      transformResponse: [...[].concat(api.defaults.transformResponse ?? []), avecStatut],
    })
    return { ...corps, dejaInscrit: statut === 200 }
  },
}
