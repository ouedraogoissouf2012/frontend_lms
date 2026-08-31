import { lmsClassesService } from '@/services/lmsClasses'
import { logError } from '@/services/errorHandler'
import { mapWithConcurrency } from '@/utils/concurrency'
import { classeLabel } from '@/utils/classes'
import { toId } from '@/utils/toId'

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
 * Charge les étudiants classe par classe, via les DÉTAILS de classe.
 *
 * `/proxy/classes/{id}/etudiants` est refusé par KLASSCI (403 « Accès non autorisé
 * à cette classe »), alors que `/lms/classes/{id}` répond 200 et contient DÉJÀ le
 * roster dans `data.etudiants` — vérifié sur les 17 classes : 210 étudiants listés
 * pour 210 déclarés. On lit donc là où la donnée est réellement disponible.
 *
 * Le N+1 reste imposé par KLASSCI, qui n'expose le roster que par classe ; on le
 * borne en parallèle plutôt que de le sérialiser. DETTE TRACÉE : seul un endpoint
 * d'agrégation backend ramènerait ce coût sous O(nb_classes).
 */
export async function fetchClassRosters(classeList, onProgress) {
  let done = 0
  const settled = await mapWithConcurrency(classeList, CLASSES_FETCH_CONCURRENCY, async (classe) => {
    const response = await lmsClassesService.getClasseDetails(classe.id)
    onProgress?.(`Chargement des étudiants… ${++done}/${classeList.length} classes`)
    // Le roster vit dans l'enveloppe des détails, pas à la racine de la réponse.
    return response?.data?.etudiants ?? []
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
      etu.classe_id = toId(classe)
      etu.classe_nom = classeLabel(classe)
      collected.push(etu)
    })
  })
  return { collected, ok, forbidden }
}
