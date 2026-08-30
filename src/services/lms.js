/**
 * Baril LMS — point d'entrée rétro-compatible (#26).
 *
 * lms.js couvrait 6 domaines en 466 lignes (violation SRP / §5 ≤ 300 l.).
 * Il est désormais découpé par domaine, miroir du split backend
 * (LMSDataController → 7 controllers) :
 *   - lmsClasses.js        — classes enrichies
 *   - lmsMatieres.js       — matières enrichies
 *   - lmsTeachers.js       — enseignants / dashboard
 *   - lmsSeances.js        — séances & présences
 *   - lmsVisio.js          — cycle de vie visio
 *
 * Frontière (#26) : lms* = données ENRICHIES `/lms/*` ; klassciService
 * (src/services/klassci.js) = proxy BRUT KLASSCI `/proxy/*`.
 *
 * Compatibilité : `lmsService` (named + default) reste un objet unique
 * composant tous les domaines, afin de ne casser aucun des appelants
 * existants. Le code NOUVEAU peut importer directement le service de
 * domaine (ex. `import { lmsVisioService } from '@/services/lmsVisio'`).
 *
 * RETIRÉ (#26) : lmsService.getClasses (`/proxy/classes`) — doublon strict de
 * klassciService.getClasses. Les appelants utilisent désormais klassciService.
 */
import { lmsClassesService } from './lmsClasses'
import { lmsMatieresService } from './lmsMatieres'
import { lmsTeachersService } from './lmsTeachers'
import { lmsSeancesService } from './lmsSeances'
import { lmsVisioService } from './lmsVisio'

// Réexport des services de domaine (imports granulaires recommandés à terme).
export { lmsClassesService } from './lmsClasses'
export { lmsMatieresService } from './lmsMatieres'
export { lmsTeachersService } from './lmsTeachers'
export { lmsSeancesService } from './lmsSeances'
export { lmsVisioService } from './lmsVisio'

/**
 * Façade rétro-compatible : agrège les méthodes de tous les domaines.
 * (Aucune collision de nom entre domaines — vérifié #26.)
 */
export const lmsService = {
  ...lmsClassesService,
  ...lmsMatieresService,
  ...lmsTeachersService,
  ...lmsSeancesService,
  ...lmsVisioService
}

export default lmsService
