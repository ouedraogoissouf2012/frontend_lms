import { klassciService } from './klassci'
import { extractList } from '../utils/apiList'

/**
 * Source + forme CANONIQUES des matières d'un enseignant/coordinateur (#315).
 *
 * La clé de cache partagée `teacher_matieres` était alimentée par 3 composables
 * via des chemins DIVERGENTS (`getTeacherDashboard().matieres` d'un côté,
 * `getMatieres()` + `extractList`/`Array.isArray` de l'autre) → formes/sources
 * incohérentes sous une même clé, un consommateur pouvant lire la donnée d'un
 * autre. Source unique = `getMatieres()` (endpoint dédié, support coordinateur,
 * déjà normalisé en tableau à la frontière #343) ; `extractList` reste un garde
 * défensif si un jour l'enveloppe nommée réapparaît.
 *
 * Imports RELATIFs volontaires (ce module côtoie les services du graphe de
 * contrat, dont le runner natif ne résout pas l'alias `@`).
 *
 * @returns {Promise<Array>} le tableau des matières, forme unique pour tous.
 */
export async function fetchTeacherMatieres() {
  return extractList(await klassciService.getMatieres(), ['matieres'])
}
