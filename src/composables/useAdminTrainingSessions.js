import { ref } from 'vue'
import { extractList } from '@/utils/apiList'
import { trainingSessionsService } from '@/services/trainingSessions'
import { useConfirm } from '@/composables/useConfirm'
import { IRREVERSIBLES, LIBELLES_TRANSITION } from '@/constants/trainingSessionTransitions'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const PHASES = {
  a_venir: 'À venir',
  inscriptions_ouvertes: 'Inscriptions ouvertes',
  en_cours: 'En cours',
  terminee: 'Terminée',
}

const STATUTS = {
  brouillon: 'Brouillon',
  publiee: 'Publiée',
  annulee: 'Annulée',
  cloturee: 'Clôturée',
  archivee: 'Archivée',
  purgee: 'Purgée',
}

export function libellePhase(phase) {
  return PHASES[phase] || phase || '—'
}

export function libelleStatut(status) {
  return STATUTS[status] || status || '—'
}

export function useAdminTrainingSessions() {
  const periodes = ref([])
  const loading = ref(false)
  const error = ref('')
  const notice = ref('')
  const page = ref(1)
  const lastPage = ref(1)
  const dernierProgrammeId = ref(null)
  const saving = ref(false)
  // Période dont une transition est en cours : ses boutons sont désactivés.
  const busyId = ref(null)

  async function load(cible = page.value) {
    loading.value = true
    error.value = ''
    try {
      const response = await trainingSessionsService.list(cible)
      periodes.value = extractList(response)
      page.value = response.meta?.current_page ?? cible
      lastPage.value = response.meta?.last_page ?? 1
    } catch (err) {
      error.value = err.userMessage || 'Impossible de charger les sessions.'
      periodes.value = []
    } finally {
      loading.value = false
    }
  }

  async function creerProgramme(titre, description) {
    saving.value = true
    error.value = ''
    notice.value = ''
    try {
      const response = await trainingSessionsService.createProgram({ titre, description })
      dernierProgrammeId.value = response.data?.id ?? null
      notice.value = response.message || 'Programme créé.'
      return true
    } catch (err) {
      error.value = err.userMessage || 'La création du programme a échoué.'
      return false
    } finally {
      saving.value = false
    }
  }

  async function creerPeriode(payload) {
    saving.value = true
    error.value = ''
    notice.value = ''
    try {
      const response = await trainingSessionsService.createPeriod(payload)
      notice.value = response.message || 'Session de formation créée.'
      await load(1)
      return true
    } catch (err) {
      error.value = err.userMessage || 'La création de la période a échoué.'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Fait avancer une période (#391, ADR-845-01). Annuler et archiver ne se défont
   * pas : une confirmation les précède. Au succès, la période est remplacée par la
   * réponse du serveur (statut et phase font foi). Sur 409, l'état a changé
   * ailleurs : la liste est rechargée AVANT d'écrire le message, car `load` efface
   * `error`.
   * @returns {Promise<boolean>} true si le serveur a appliqué la transition.
   */
  async function transitionner(periode, action) {
    if (IRREVERSIBLES.includes(action)) {
      const ok = await useConfirm().confirm({
        message: `${LIBELLES_TRANSITION[action]} « ${periode.libelle} » ? Cette opération est irréversible ; les inscriptions déjà faites sont conservées.`,
        variant: 'danger',
        confirmLabel: LIBELLES_TRANSITION[action],
      })
      if (!ok) return false
    }

    busyId.value = periode.id
    error.value = ''
    notice.value = ''
    try {
      const response = await trainingSessionsService.transition(periode.id, action)
      const index = periodes.value.findIndex((p) => p.id === periode.id)
      if (index !== -1) periodes.value[index] = { ...periodes.value[index], ...response.data }
      notice.value = response.message || 'Période mise à jour.'
      return true
    } catch (err) {
      const message = err?.userMessage || ERROR_MESSAGES.unknown
      if (err?.response?.status === 409) await load(page.value)
      error.value = message
      return false
    } finally {
      busyId.value = null
    }
  }

  return {
    periodes, loading, error, notice, page, lastPage,
    dernierProgrammeId, saving, busyId,
    load, creerProgramme, creerPeriode, transitionner,
  }
}
