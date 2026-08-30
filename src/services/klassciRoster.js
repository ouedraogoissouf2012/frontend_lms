import klassciService from '@/services/klassci'
import { logError } from '@/services/errorHandler'
import { mapWithConcurrency } from '@/utils/concurrency'
import { classeLabel } from '@/utils/classes'

// Plafond de requêtes simultanées vers /proxy/classes/{id}/etudiants. Borné à
// dessein : le backend proxifie KLASSCI derrière un quota (`x-ratelimit-limit`),
// un fan-out non borné le ferait tomber en 429 sur un gros établissement.
const CLASSES_FETCH_CONCURRENCY = 4

/**
 * Un refus d'AUTORISATION est déterministe : il sera identique sur toutes les
 * autres classes. Le qualifier permet d'arrêter le parcours au premier au lieu de
 * lancer N-1 requêtes perdues d'avance. Les échecs TRANSITOIRES (503, délai
 * dépassé) en sont volontairement exclus : eux méritent que les autres soient tentés.
 */
export const isForbidden = (reason) => reason?.response?.status === 403

/**
 * Charge les étudiants classe par classe. Le N+1 est imposé par KLASSCI, qui ne
 * les expose pas autrement ; on le borne en parallèle plutôt que de le sérialiser.
 * DETTE TRACÉE : seul un endpoint d'agrégation backend ramènera ce coût sous
 * O(nb_classes).
 */
export async function fetchClassRosters(classeList, onProgress) {
  let done = 0
  const settled = await mapWithConcurrency(classeList, CLASSES_FETCH_CONCURRENCY, async (classe) => {
    const data = await klassciService.getClasseEtudiants(classe.id)
    onProgress?.(`Chargement des étudiants… ${++done}/${classeList.length} classes`)
    return data
  }, { stopWhen: isForbidden })

  const collected = []
  let ok = 0
  let forbidden = false
  settled.forEach((outcome, i) => {
    const classe = classeList[i]
    if (outcome.status === 'skipped') return
    if (outcome.status === 'rejected') {
      if (isForbidden(outcome.reason)) forbidden = true
      // logError (prod-safe) et non console.warn : les console.* sont neutralisés
      // en production, l'échec ne laissait donc AUCUNE trace là-bas.
      logError(outcome.reason, `[useAdminUsers] étudiants de la classe ${classe?.id}`)
      return
    }
    ok++
    const arr = Array.isArray(outcome.value) ? outcome.value : []
    arr.forEach(etu => {
      etu.classe_id = classe.id
      etu.classe_nom = classeLabel(classe)
      collected.push(etu)
    })
  })
  return { collected, ok, forbidden }
}
