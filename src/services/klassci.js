/**
 * Service KLASSCI — façade rétro-compatible (G9 — split par domaine).
 *
 * Frontière d'usage (#26) :
 *  - klassciService (CE fichier) : passe-plat vers les endpoints `/proxy/*`,
 *    données KLASSCI brutes (classes, matières, structure académique).
 *  - lmsService (src/services/lms.js) : données ENRICHIES LMS via `/lms/*`
 *    (combinent KLASSCI + données locales LMS : leçons, stats, présences…).
 *
 * Règle : pour une donnée enrichie LMS, utiliser lmsService. N'utiliser
 * klassciService que pour la donnée KLASSCI brute (ex. liste des classes).
 *
 * Découpage par domaine (G9 — miroir du split lms.js #26, §5 ≤ 300 l.) :
 *   - klassciStructure.js    — structure académique brute (/proxy/*)
 *   - klassciDashboard.js    — dashboards élève/enseignant (/proxy/me/*)
 *   - klassciSeances.js      — séances à venir & visio élève
 *   - klassciEvaluations.js  — évaluations KLASSCI & de l'élève
 *   - klassciCourses.js      — vrais cours (leçons) de l'élève
 *   - klassciAdmin.js        — enseignants LMS & matières admin enrichies
 *
 * Compatibilité : `klassciService` (named + default) reste un objet unique
 * agrégeant tous les domaines, afin de ne casser aucun appelant existant. Le
 * code NOUVEAU peut importer directement le service de domaine
 * (ex. `import { klassciSeancesService } from '@/services/klassciSeances'`).
 *
 * RETIRÉ antérieurement (#26/#17) : getMatiereDetails & getLmsMatiereDetails
 * (doublons orphelins → lmsService.getMatiereDetails) et search() (route
 * inexistante → searchService).
 */
import { klassciStructureService } from './klassciStructure'
import { klassciDashboardService } from './klassciDashboard'
import { klassciSeancesService } from './klassciSeances'
import { klassciEvaluationsService } from './klassciEvaluations'
import { klassciCoursesService } from './klassciCourses'
import { klassciAdminService } from './klassciAdmin'

// Réexport des services de domaine (imports granulaires recommandés à terme).
export { klassciStructureService } from './klassciStructure'
export { klassciDashboardService } from './klassciDashboard'
export { klassciSeancesService } from './klassciSeances'
export { klassciEvaluationsService } from './klassciEvaluations'
export { klassciCoursesService } from './klassciCourses'
export { klassciAdminService } from './klassciAdmin'

/**
 * Façade rétro-compatible : agrège les méthodes de tous les domaines.
 * (Aucune collision de nom entre domaines — vérifié G9.)
 */
export const klassciService = {
  ...klassciStructureService,
  ...klassciDashboardService,
  ...klassciSeancesService,
  ...klassciEvaluationsService,
  ...klassciCoursesService,
  ...klassciAdminService
}

export default klassciService
