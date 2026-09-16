import { ref } from 'vue'
import { extractList } from '@/utils/apiList'
import { trainingSessionsService } from '@/services/trainingSessions'

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

  return {
    periodes, loading, error, notice, page, lastPage,
    dernierProgrammeId, saving,
    load, creerProgramme, creerPeriode,
  }
}
