import { ref } from 'vue'
import { extractList } from '@/utils/apiList'
import { enrolmentCodesService } from '@/services/enrolmentCodes'
import { useConfirm } from '@/composables/useConfirm'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

/**
 * Codes d'inscription côté personnel (#391, ADR-803-03).
 *
 * Émettre REMPLACE le code précédent : si un code est actif, l'élève qui l'a reçu ne
 * pourra plus s'en servir, d'où une confirmation. Retirer ferme la porte aux suivants
 * sans désinscrire personne. Le serveur reste l'autorité : un établissement relié à
 * KLASSCI reçoit 403 (le menu et la route sont déjà gardés par la capacité).
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
  const busyId = ref(null)

  async function load(cible = page.value) {
    loading.value = true
    error.value = ''
    try {
      const response = await enrolmentCodesService.listClasses(cible)
      classes.value = extractList(response)
      page.value = response.meta?.current_page ?? cible
      lastPage.value = response.meta?.last_page ?? 1
    } catch (err) {
      error.value = err?.userMessage || ERROR_MESSAGES.unknown
      classes.value = []
    } finally {
      loading.value = false
    }
  }

  async function avecConfirmation(message, confirmLabel) {
    return useConfirm().confirm({ message, confirmLabel, variant: 'danger' })
  }

  /** Émet (ou régénère) le code d'une classe ; met la ligne à jour depuis la réponse. */
  async function emettre(classe) {
    if (classe.code_inscription?.etat === 'actif') {
      const ok = await avecConfirmation(
        `Régénérer le code de « ${classe.libelle} » ? L'ancien code ne fonctionnera plus. Les inscriptions déjà faites sont conservées.`,
        'Régénérer'
      )
      if (!ok) return false
    }
    busyId.value = classe.id
    error.value = ''
    notice.value = ''
    try {
      const response = await enrolmentCodesService.emettre(classe.id)
      const index = classes.value.findIndex((c) => c.id === classe.id)
      if (index !== -1) {
        classes.value[index] = {
          ...classes.value[index],
          code_inscription: { etat: 'actif', valeur: response.data?.code_inscription ?? null },
        }
      }
      notice.value = response.message || 'Code émis.'
      return true
    } catch (err) {
      error.value = err?.userMessage || ERROR_MESSAGES.unknown
      return false
    } finally {
      busyId.value = null
    }
  }

  /** Retire le code d'une classe ; relit la liste (la réponse n'a pas de corps). */
  async function retirer(classe) {
    const ok = await avecConfirmation(
      `Retirer le code de « ${classe.libelle} » ? Il ne permettra plus de rejoindre la classe. Les inscriptions déjà faites sont conservées.`,
      'Retirer'
    )
    if (!ok) return false
    busyId.value = classe.id
    error.value = ''
    notice.value = ''
    try {
      const response = await enrolmentCodesService.retirer(classe.id)
      await load(page.value)
      notice.value = response.message || 'Code retiré.'
      return true
    } catch (err) {
      error.value = err?.userMessage || ERROR_MESSAGES.unknown
      return false
    } finally {
      busyId.value = null
    }
  }

  return { classes, loading, error, notice, page, lastPage, busyId, load, emettre, retirer }
}
