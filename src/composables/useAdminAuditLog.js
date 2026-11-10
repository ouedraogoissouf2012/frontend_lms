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
  let derniere = 0

  /** `null` : rien à dire ; 'journal' : le journal est vide ; 'filtre' : rien pour ce filtre. */
  const etatVide = computed(() => {
    if (!charge.value || erreur.value || total.value > 0) return null
    return action.value || acteur.value ? 'filtre' : 'journal'
  })

  async function charger(cible = page.value) {
    const numero = ++derniere
    chargement.value = true
    erreur.value = ''
    peutReessayer.value = false
    try {
      const reponse = await auditLogService.list({ page: cible, action: action.value, userId: acteur.value?.id ?? null })
      if (numero !== derniere) return
      const pagination = reponse?.data ?? {}
      entrees.value = extractList(reponse)
      page.value = pagination.current_page ?? cible
      dernierePage.value = pagination.last_page ?? 1
      total.value = pagination.total ?? entrees.value.length
      charge.value = true
    } catch (err) {
      if (numero !== derniere) return
      entrees.value = []
      charge.value = false
      erreur.value = err?.userMessage || 'Impossible de charger le journal d’audit.'
      peutReessayer.value = estPannePassagere(err)
    } finally {
      if (numero === derniere) chargement.value = false
    }
  }

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
    charger, pagePrecedente, pageSuivante, choisirAction, filtrerActeur, retirerActeur,
  }
}
