import { ref } from 'vue'
import { extractList } from '@/utils/apiList'
import { enrolmentCodesService } from '@/services/enrolmentCodes'
import { useConfirm } from '@/composables/useConfirm'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

/**
 * Codes d'inscription côté personnel (#391, ADR-803-03).
 *
 * Émettre REMPLACE le code précédent : si un code est (peut-être) actif, l'élève qui l'a
 * reçu ne pourra plus s'en servir, d'où une confirmation. Retirer ferme la porte aux
 * suivants sans désinscrire personne. Le serveur reste l'autorité : un établissement
 * relié à KLASSCI reçoit 403 (le menu et la route sont déjà gardés par la capacité).
 *
 * Un ÉCHEC d'émission ou de retrait (délai, réseau) peut avoir déjà changé le code côté
 * serveur : la liste est relue, et l'écran ne dit « actualisée » qu'après une relecture
 * réussie. Si elle échoue aussi, le code de la classe passe à l'état « inconnu » : il
 * n'est plus montré, pour ne pas dicter un code peut-être invalidé.
 *
 * Le code est rendu EN CLAIR pour être transmis, et n'est JAMAIS journalisé : aucune
 * console ici, et les erreurs sont réduites à leur `userMessage`.
 */
export function useEnrolmentCodes() {
  const classes = ref([])
  const loading = ref(false)
  const error = ref('')
  const notice = ref('')
  const page = ref(1)
  const lastPage = ref(1)
  // Une classe en vol n'en bloque pas une autre ; la fin de l'une ne libère pas l'autre.
  const occupees = ref(new Set())

  const estOccupee = (id) => occupees.value.has(id)
  function occuper(id) { occupees.value = new Set(occupees.value).add(id) }
  function liberer(id) {
    const reste = new Set(occupees.value)
    reste.delete(id)
    occupees.value = reste
  }

  async function lire(cible) {
    const response = await enrolmentCodesService.listClasses(cible)
    classes.value = extractList(response)
    page.value = response.meta?.current_page ?? cible
    lastPage.value = response.meta?.last_page ?? 1
  }

  /** Chargement demandé (montage, « Actualiser », pagination) : un seul bandeau à la fois. */
  async function load(cible = page.value) {
    loading.value = true
    error.value = ''
    notice.value = ''
    try {
      await lire(cible)
      return true
    } catch (err) {
      error.value = err?.userMessage || ERROR_MESSAGES.unknown
      classes.value = []
      return false
    } finally {
      loading.value = false
    }
  }

  function majCode(id, codeInscription) {
    classes.value = classes.value.map((c) => (c.id === id ? { ...c, code_inscription: codeInscription } : c))
  }

  /**
   * Après un échec, trois cas :
   * - SANS RÉPONSE (délai, réseau) : le POST a pu être reçu et tenir un verrou au-delà du
   *   délai client ; une relecture lirait l'ancien code, invalidé juste après. Le code
   *   devient inconnu, sans relecture ni « actualisée » ;
   * - réponse 5xx ou 409 (l'état a changé ailleurs) : la relecture fait foi ;
   * - refus NET (403, 404, 422, 429) : rien n'a changé, message seul.
   */
  async function signalerEchec(classe, err) {
    const message = err?.userMessage || ERROR_MESSAGES.unknown
    const status = err?.response?.status
    if (status == null) {
      majCode(classe.id, { etat: 'inconnu', valeur: null })
      error.value = message
      return
    }
    if (status < 500 && status !== 409) {
      error.value = message
      return
    }
    try {
      await lire(page.value)
      error.value = `${message} ${ERROR_MESSAGES.listeActualisee}`
    } catch {
      majCode(classe.id, { etat: 'inconnu', valeur: null })
      error.value = message
    }
  }

  async function avecConfirmation(message, confirmLabel) {
    return useConfirm().confirm({ message, confirmLabel, variant: 'danger' })
  }

  /** Émet (ou régénère) le code d'une classe ; met la ligne à jour depuis la réponse. */
  async function emettre(classe) {
    if (estOccupee(classe.id)) return false
    if (['actif', 'inconnu'].includes(classe.code_inscription?.etat)) {
      const ok = await avecConfirmation(
        `Régénérer le code de « ${classe.libelle} » ? L'ancien code ne fonctionnera plus. Les inscriptions déjà faites sont conservées.`,
        'Régénérer'
      )
      // Deux clics pendant la boîte de dialogue : le premier confirmé occupe la classe.
      if (!ok || estOccupee(classe.id)) return false
    }
    occuper(classe.id)
    error.value = ''
    notice.value = ''
    try {
      const response = await enrolmentCodesService.emettre(classe.id)
      majCode(classe.id, { etat: 'actif', valeur: response.data?.code_inscription ?? null })
      notice.value = response.message || 'Code émis.'
      return true
    } catch (err) {
      await signalerEchec(classe, err)
      return false
    } finally {
      liberer(classe.id)
    }
  }

  /** Retire le code d'une classe ; la réponse n'a pas de corps, l'état est connu. */
  async function retirer(classe) {
    if (estOccupee(classe.id)) return false
    const ok = await avecConfirmation(
      `Retirer le code de « ${classe.libelle} » ? Il ne permettra plus de rejoindre la classe. Les inscriptions déjà faites sont conservées.`,
      'Retirer'
    )
    if (!ok || estOccupee(classe.id)) return false
    occuper(classe.id)
    error.value = ''
    notice.value = ''
    try {
      const response = await enrolmentCodesService.retirer(classe.id)
      majCode(classe.id, { etat: 'retire', valeur: null })
      notice.value = response.message || 'Code retiré.'
      return true
    } catch (err) {
      await signalerEchec(classe, err)
      return false
    } finally {
      liberer(classe.id)
    }
  }

  return { classes, loading, error, notice, page, lastPage, estOccupee, load, emettre, retirer }
}
