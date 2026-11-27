import api from './api'
import { endpoints } from './endpoints'
import { invalidResponseError } from './errorHandler'

/**
 * #683 (lms_backend#1676) : `GET /lms/classes/{id}/resultats`, par l'identifiant de l'ESPACE SOURCE
 * de l'école (celui de `idPourKlassci()`), sur une période facultative `du`/`au` (AAAA-MM-JJ).
 *
 * Le personnel reçoit la classe entière (`statistiques`, `couverture`) ; l'élève, sa seule ligne,
 * son `rang` seulement si l'école l'autorise. Une réponse sans `eleves` n'est pas un bilan : elle
 * est refusée ici plutôt qu'affichée comme une classe vide.
 */
export async function lireBilanDeClasse(id, { du = '', au = '' } = {}) {
  const params = {}
  if (du) params.du = du
  if (au) params.au = au

  const corps = await api.get(endpoints.lms.classes.resultats(id), { params })
  const bilan = corps?.data
  if (!bilan || typeof bilan !== 'object' || !Array.isArray(bilan.eleves) || !Array.isArray(bilan.matieres)) {
    throw invalidResponseError('bilan de classe', corps)
  }

  return bilan
}
