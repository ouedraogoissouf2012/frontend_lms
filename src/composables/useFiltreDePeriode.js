import { ref } from 'vue'
import { trainingSessionsService } from '@/services/trainingSessions'

/** Le choix « Toutes les périodes » : aucun filtre. */
export const TOUTES = ''

/** Borne des pages lues (25 périodes par page), comme `usePeriodesRecevables`. */
const PAGES_MAX = 20

/**
 * Le filtre de période des écrans Classes et Séances de la gestion (#707).
 *
 * - Les périodes de l'école sont lues UNE fois, toutes les pages ; la période marquée `en_cours` (lms#1651) est le
 *   choix par défaut. Sans elle, `TOUTES` : rien n'est inventé.
 * - Une classe est retenue par sa période (`periode: {id, libelle} | null`, lms#1785) ; une séance, par sa classe.
 * - Sans période lisible (école sans période, ou refus), `periodes` reste vide, le sélecteur se cache, et tout est
 *   retenu : un écran n'est jamais vidé par un filtre qu'on ne voit pas.
 */
export function useFiltreDePeriode() {
  const periodes = ref([])
  const choix = ref(TOUTES)

  async function charger() {
    const lues = []
    try {
      for (let page = 1, derniere = 1; page <= derniere && page <= PAGES_MAX; page += 1) {
        const response = await trainingSessionsService.list(page)
        if (response?.success !== true || !Array.isArray(response.data)) throw new Error('périodes illisibles')
        lues.push(...response.data.filter((p) => Number.isInteger(p?.id)))
        derniere = Number.isInteger(response.meta?.last_page) ? response.meta.last_page : 1
      }
    } catch {
      lues.length = 0
    }
    periodes.value = lues
    choix.value = lues.find((p) => p.en_cours === true)?.id ?? TOUTES
  }

  /** @param {{ periode?: ?{ id: number } }} classe */
  function classeRetenue(classe) {
    return choix.value === TOUTES || classe?.periode?.id === choix.value
  }

  /**
   * @param {Array<{ classe_id?: ?number }>} seances
   * @param {Array<{ id: number, periode?: ?{ id: number } }>} classes
   */
  function seancesRetenues(seances, classes) {
    if (choix.value === TOUTES) return seances
    const deLaPeriode = new Set(classes.filter(classeRetenue).map((c) => c.id))
    return seances.filter((s) => deLaPeriode.has(s.classe_id))
  }

  return { periodes, choix, charger, classeRetenue, seancesRetenues }
}
