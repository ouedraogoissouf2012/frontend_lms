import api from './api'
import { endpoints } from './endpoints'
// #296 : normalisation d'enveloppe à la frontière (import RELATIF — le runner
// natif des tests de contrat ne résout pas l'alias @).
import { extractList } from '../utils/apiList'

/**
 * Service LMS — domaine ENSEIGNANTS (`/lms/enseignants`, dashboard enseignant).
 *
 * NOTE intercepteur : api.js retourne déjà response.data (ne pas refaire .data ici).
 */
export const lmsTeachersService = {
  /**
   * Récupérer tous les enseignants (via LMS + KLASSCI)
   * @param {boolean} withDetails - Inclure détails complets (classes, matières, stats)
   * @returns {Promise<Object>} { success, data: [...] }
   */
  async getEnseignants(withDetails = false) {
    try {
      // Query string ?with_details (orthogonale) laissée au client — cf. endpoints.js.
      const url = withDetails ? `${endpoints.lms.enseignants}?with_details=true` : endpoints.lms.enseignants
      // #296 : dé-wrap à la frontière → tableau canonique (les consommateurs ne
      // dé-wrappent plus). Chaque enseignant garde ses champs imbriqués (with_details).
      return extractList(await api.get(url), ['enseignants'])
    } catch (error) {
      console.error('Erreur récupération enseignants:', error)
      throw error
    }
  }

  // `getTeacherDashboard` a été SUPPRIMÉE ici (#329).
  //
  // Elle appelait `endpoints.klassci.teacherDashboard`, c'est-à-dire `/proxy/*`,
  // depuis un service `lms*` — une violation de la frontière que `endpoints.js`
  // déclare pourtant gardée par test (#26). Le nom disait « LMS », le code
  // parlait au CRM : tout inventaire du couplage fondé sur les noms de services
  // était donc faux.
  //
  // Elle n'avait AUCUN appelant applicatif, ni directement ni via la façade
  // `lmsService` : les consommateurs réels passent tous par
  // `klassciDashboardService.getTeacherDashboard()`. On ne redirige pas du code
  // mort, on le retire.
  //
  // Les deux méthodes n'étaient d'ailleurs PAS interchangeables — contrairement
  // à ce qu'un « doublon strict » laisserait croire : celle-ci rendait
  // l'enveloppe complète, celle de `klassciDashboard` rend `data` déballé ou
  // `null`. Rediriger les appelants aurait changé leur contrat de retour.
}

export default lmsTeachersService
