import { ref } from 'vue'
import { trainingSessionsService } from '@/services/trainingSessions'
import { invalidResponseError } from '@/services/errorHandler'

/**
 * Les périodes qui REÇOIVENT une classe (#657) : en brouillon ou publiées. Le serveur refuse (422)
 * une période annulée, clôturée ou archivée (`TrainingSessionStatus::fermeLesInscriptions`) ; les
 * proposer ferait cliquer pour un refus. Un brouillon reçoit : on y rattache des classes pendant
 * qu'on prépare la session.
 *
 * Chargées UNE fois pour tout l'écran, et non par carte : toutes les pages (25 par page), dans la
 * borne `PAGES_MAX`, pour qu'aucune période ne manque au choix.
 */
const RECEVABLES = new Set(['brouillon', 'publiee'])
const PAGES_MAX = 20

export function usePeriodesRecevables() {
  const periodes = ref([])
  const charge = ref(false)
  const erreur = ref(false)

  async function charger() {
    erreur.value = false
    const lues = []
    try {
      for (let page = 1, derniere = 1; page <= derniere && page <= PAGES_MAX; page += 1) {
        const response = await trainingSessionsService.list(page)
        if (response?.success !== true || !Array.isArray(response.data)) throw invalidResponseError('GET périodes illisible', response)
        lues.push(...response.data.filter((p) => Number.isInteger(p?.id) && RECEVABLES.has(p.status)))
        derniere = Number.isInteger(response.meta?.last_page) ? response.meta.last_page : 1
      }
      periodes.value = lues
    } catch {
      periodes.value = []
      erreur.value = true
    } finally {
      charge.value = true
    }
  }

  return { periodes, charge, erreur, charger }
}

/** Le libellé de la période d'une classe : une période absente de la liste reste nommée par son état. */
export function libellePeriode(classe, periodes) {
  if (!classe || !Object.hasOwn(classe, 'training_session_id')) return 'Période : non communiquée'
  const id = classe.training_session_id
  if (id === null) return 'Période : aucune'
  const periode = periodes.find((p) => p.id === id)
  return periode ? `Période : ${periode.libelle}` : 'Période : close ou archivée'
}
