import { computed, onMounted, ref } from 'vue'
import { auditLogService } from '@/services/auditLog'
import { extractList } from '@/utils/apiList'
import { estPannePassagere } from '@/utils/pannePassagere'

/**
 * Données de l'écran « Journal d'audit » du supradmin (D126/D127).
 *
 * Trois états honnêtes : `chargement` ; un journal VIDE seulement après une réponse RÉUSSIE de
 * total nul (`etatVide`) ; une `erreur` qui dit le motif posé par l'intercepteur et vide la liste
 * sans jamais se faire passer pour un vide. `peutReessayer` : seulement sur une panne passagère.
 * Changer un filtre repart de la page 1 ; une réponse périmée (requête doublée) est ignorée.
 *
 * Revue de #512 : `reessayer` rejoue la requête QUI A ÉCHOUÉ (page demandée, filtres en cours),
 * pas la page affichée ; une page au-delà de la dernière (Laravel rend `data: []` avec un total
 * non nul, par exemple après une purge de rétention) recharge la dernière page ; une page sans
 * pagination lisible est une erreur, jamais une pagination inventée.
 */
export function useAdminAuditLog() {
  const entrees = ref([])
  const chargement = ref(false)
  const erreur = ref('')
  const peutReessayer = ref(false)
  const charge = ref(false)
  const page = ref(1)
  const dernierePage = ref(1)
  const total = ref(0)
  const action = ref('')
  const acteur = ref(null)
  let demandee = 1
  let derniere = 0

  /** `null` : rien à dire ; 'journal' : le journal est vide ; 'filtre' : rien pour ce filtre. */
  const etatVide = computed(() => {
    if (!charge.value || erreur.value || total.value > 0) return null
    return action.value || acteur.value ? 'filtre' : 'journal'
  })

  function echouer(message, reessayable) {
    entrees.value = []
    charge.value = false
    erreur.value = message
    peutReessayer.value = reessayable
  }

  async function charger(cible = page.value) {
    const numero = ++derniere
    demandee = cible
    chargement.value = true
    erreur.value = ''
    peutReessayer.value = false
    try {
      const reponse = await auditLogService.list({ page: cible, action: action.value, userId: acteur.value?.id ?? null })
      if (numero !== derniere) return
      const { current_page: courante, last_page: derniereLue, total: totalLu } = reponse?.data ?? {}
      if (![courante, derniereLue, totalLu].every(Number.isInteger)) {
        echouer('La réponse du journal d’audit est illisible.', false)
        return
      }
      const lignes = extractList(reponse)
      // Page au-delà de la dernière : on recharge la dernière, une seule fois (elle existe : total > 0).
      if (lignes.length === 0 && totalLu > 0 && cible > derniereLue) {
        await charger(derniereLue)
        return
      }
      entrees.value = lignes
      page.value = courante
      dernierePage.value = derniereLue
      total.value = totalLu
      charge.value = true
    } catch (err) {
      if (numero !== derniere) return
      echouer(err?.userMessage || 'Impossible de charger le journal d’audit.', estPannePassagere(err))
    } finally {
      if (numero === derniere) chargement.value = false
    }
  }

  const reessayer = () => charger(demandee)
  const pagePrecedente = () => { if (page.value > 1) charger(page.value - 1) }
  const pageSuivante = () => { if (page.value < dernierePage.value) charger(page.value + 1) }

  function choisirAction(valeur) {
    action.value = valeur
    charger(1)
  }

  /** @param {{id: number, name?: string}|null} user acteur d'une entrée */
  function filtrerActeur(user) {
    if (user?.id == null) return
    acteur.value = { id: user.id, name: user.name ?? '' }
    charger(1)
  }

  function retirerActeur() {
    acteur.value = null
    charger(1)
  }

  onMounted(() => charger(1))

  return {
    entrees, chargement, erreur, peutReessayer, etatVide,
    page, dernierePage, total, action, acteur,
    charger, reessayer, pagePrecedente, pageSuivante, choisirAction, filtrerActeur, retirerActeur,
  }
}
