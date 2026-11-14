import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { formatDate as fmtDate, formatTime as fmtTime } from '@/utils/formatters'
import { useRoute } from 'vue-router'
import lmsService from '@/services/lms'
import attendanceExportService from '@/services/attendanceExport'
// #28 : logique métier pure extraite (testée dans tests/unit/attendance.test.js)
import { getPeriodDates as computePeriodDates } from '@/utils/attendance'
import { toast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { invalidResponseError, messageDe } from '@/services/errorHandler'
import { estPannePassagere } from '@/utils/pannePassagere'

/**
 * Couche données de l'historique des séances + présences (H7, ≤300) extraite de
 * `views/attendance/SeanceAttendanceHistory.vue`.
 *
 * Gère la liste des séances (chargement/erreur/pagination), les filtres
 * (période + recherche débouncée), l'ouverture de la modale de présences
 * (chargement par séance, y compris ouverture directe par route), les exports
 * PDF/Excel et la suppression. La vue ne fait plus que câbler les sous-composants.
 *
 * Notifications (Lot F3) : toasts via le service unifié `@/composables/useToast` (rendu
 * par l'unique <ToastContainer> de App.vue). Remplace l'ancien `$toast`
 * (globalProperties jamais enregistré → deleteSeance levait : bug latent corrigé).
 *
 * Parité (#H7) :
 * - formatDate/formatTime/formatDuration restent LOCAUX (non convergés vers
 *   @/utils/formatters) pour un rendu strictement inchangé.
 * - getInitials et formatDateInput : méthodes MORTES d'origine conservées (dette documentée).
 */
export function useSeanceAttendanceHistory() {
  // Instance pour le pont route (proxy.$route ci-dessous). Toasts via `toast` (cf. supra).
  const instance = getCurrentInstance()
  // Pont route double source (proxy.$route + repli useRoute()/sûr) — voir specs decomposition-300.
  const route = instance?.proxy?.$route ?? useRoute() ?? { params: {}, query: {} }

  const loading = ref(false)
  const error = ref(null)
  // Un nouvel essai seulement sur une panne passagère (5xx, 429, réseau) : un refus définitif ne se
  // lève pas en réessayant. Un drapeau par chargement : la liste, puis les présences de la modale.
  const canRetry = ref(true)
  const seances = ref([])
  const pagination = ref({
    current_page: 1,
    per_page: 50,
    total: 0,
    last_page: 1
  })
  const selectedPeriod = ref('week')
  const periodTabs = [
    { value: 'today', label: 'Aujourd\'hui', icon: 'fa-circle' },
    { value: 'week', label: 'Cette semaine', icon: 'fa-calendar' },
    { value: 'month', label: 'Ce mois', icon: 'fa-calendar-check-o' },
    { value: 'custom', label: 'Personnalisé', icon: 'fa-clock-o' }
  ]
  const customDates = reactive({
    from: '',
    to: ''
  })
  const searchQuery = ref('')
  let debounceTimer = null
  const selectedSeance = ref(null)
  const loadingAttendances = ref(false)
  const attendances = ref(null)
  const attendancesError = ref(null)
  const attendancesCanRetry = ref(true)
  const exporting = ref(false)

  async function loadSeances(page = 1) {
    loading.value = true
    error.value = null
    canRetry.value = true

    try {
      const params = {
        page,
        per_page: pagination.value.per_page
      }

      const dates = getPeriodDates()
      if (dates.from) params.date_from = dates.from
      if (dates.to) params.date_to = dates.to

      if (searchQuery.value) {
        params.search = searchQuery.value
      }

      const response = await lmsService.getSeancesHistory(params)
      // Faux vide : un « success: false » est une erreur dite, jamais une liste vide (règle commune).
      if (response?.success !== true) throw invalidResponseError('GET historique des séances sans success', response)
      seances.value = response.data
      pagination.value = response.pagination
    } catch (err) {
      error.value = messageDe(err)
      canRetry.value = estPannePassagere(err)
    } finally {
      loading.value = false
    }
  }

  function getPeriodDates() {
    // #28 : logique pure déléguée à utils/attendance
    return computePeriodDates(selectedPeriod.value, customDates)
  }

  function selectPeriod(period) {
    selectedPeriod.value = period
    if (period !== 'custom') {
      loadSeances()
    }
  }

  function applyCustomDates() {
    loadSeances()
  }

  function debouncedSearch() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      loadSeances()
    }, 500)
  }

  function clearSearch() {
    searchQuery.value = ''
    loadSeances()
  }

  function changePage(page) {
    if (page >= 1 && page <= pagination.value.last_page) {
      loadSeances(page)
    }
  }

  async function openSeanceById(seanceId) {
    // Chercher la séance dans la liste déjà chargée
    let seance = seances.value.find(s => s.id === seanceId)

    if (seance) {
      // Séance trouvée dans la liste, ouvrir le modal
      await viewAttendances(seance)
    } else {
      // Séance pas dans la liste (autre période), charger directement les présences
      selectedSeance.value = { id: seanceId, klassci_seance_id: seanceId, matiere_nom: '', date: '' }
      const response = await loadAttendances(seanceId)
      // Mettre à jour les infos de la séance depuis la réponse
      if (response?.success && response.seance) {
        selectedSeance.value = {
          ...selectedSeance.value,
          matiere_nom: response.seance.matiere_nom || '',
          date: response.seance.date || '',
          enseignant_nom: response.seance.enseignant_nom || '',
          klassci_seance_id: response.seance.klassci_seance_id || seanceId
        }
      }
    }
  }

  async function viewAttendances(seance) {
    selectedSeance.value = seance
    await loadAttendances(seance.id)
  }

  // Chargement des présences, commun aux deux ouvertures : rend la réponse, ou null sur échec.
  async function loadAttendances(seanceId) {
    loadingAttendances.value = true
    attendances.value = null
    attendancesError.value = null
    attendancesCanRetry.value = true

    try {
      const response = await lmsService.getSeanceAttendances(seanceId)
      if (response?.success !== true) throw invalidResponseError('GET présences de la séance sans success', response)
      attendances.value = response
      return response
    } catch (err) {
      attendancesError.value = messageDe(err)
      attendancesCanRetry.value = estPannePassagere(err)
      return null
    } finally {
      loadingAttendances.value = false
    }
  }

  function closeModal() {
    selectedSeance.value = null
    attendances.value = null
    attendancesError.value = null
  }

  /**
   * Exporter la liste de présence en PDF
   */
  // #28 : téléchargement (fetch + blob) délégué à attendanceExportService.
  async function exportPDF() {
    if (exporting.value || !selectedSeance.value) return
    exporting.value = true
    try {
      await attendanceExportService.exportPdf(selectedSeance.value.id)
    } catch (error) {
      console.error('[SeanceHistory] Erreur export PDF:', error)
      toast.error('Erreur lors de l\'export PDF : ' + error.message)
    } finally {
      exporting.value = false
    }
  }

  async function exportExcel() {
    if (exporting.value || !selectedSeance.value) return
    exporting.value = true
    try {
      await attendanceExportService.exportExcel(selectedSeance.value.id)
    } catch (error) {
      console.error('[SeanceHistory] Erreur export Excel:', error)
      toast.error('Erreur lors de l\'export Excel : ' + error.message)
    } finally {
      exporting.value = false
    }
  }

  async function deleteSeance(seance) {
    const msg = `Êtes-vous sûr de vouloir supprimer la séance ${seance.klassci_seance_id} ?`
    if (!(await useConfirm().confirm({ message: msg, variant: 'danger', confirmLabel: 'Supprimer' }))) return

    try {
      await lmsService.deleteSeance(seance.id)
      toast.success('Séance supprimée avec succès')
      loadSeances() // Recharger la liste
    } catch (err) {
      toast.error(messageDe(err))
    }
  }

  // #283 : délèguent aux formatters canoniques (replis locaux conservés).
  function formatDate(dateString) {
    return fmtDate(dateString, { fallback: '-' })
  }

  function formatTime(dateString) {
    return fmtTime(dateString, { fallback: '-' })
  }

  // Dette PRÉEXISTANTE : méthode jamais appelée dans le composant d'origine,
  // conservée à l'identique (#H7).
  function formatDateInput(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  function formatDuration(minutes) {
    if (!minutes || minutes === 0) return '-'

    // Arrondir les minutes totales d'abord
    const totalMinutes = Math.round(minutes)
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60

    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
    } else {
      return `${totalMinutes} min`
    }
  }

  // Dette PRÉEXISTANTE : méthode jamais appelée dans le composant d'origine,
  // conservée à l'identique (#H7).
  function getInitials(name) {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  onMounted(async () => {
    await loadSeances()

    // Si un seanceId est passé en paramètre, ouvrir directement le modal de présences
    const seanceId = route.params.seanceId
    if (seanceId) {
      openSeanceById(parseInt(seanceId))
    }
  })

  return {
    loading, error, canRetry, seances, pagination,
    selectedPeriod, periodTabs, customDates, searchQuery,
    selectedSeance, loadingAttendances, attendances, attendancesError, attendancesCanRetry, exporting,
    loadSeances, selectPeriod, applyCustomDates, debouncedSearch, clearSearch,
    changePage, openSeanceById, viewAttendances, closeModal,
    exportPDF, exportExcel, deleteSeance,
    formatDate, formatTime, formatDateInput, formatDuration, getInitials
  }
}
