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

  rejoindre(code) {
    return api.post(endpoints.enrolment.rejoindre, { code })
  },
}
