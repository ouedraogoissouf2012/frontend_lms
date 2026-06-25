import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import lmsService from '@/services/lms'
import attendanceExportService from '@/services/attendanceExport'
// #28 : logique métier pure extraite (testée dans tests/unit/attendance.test.js)
import { getPeriodDates as computePeriodDates } from '@/utils/attendance'

/**
 * Couche données de l'historique des séances + présences (H7, ≤300) extraite de
 * `views/attendance/SeanceAttendanceHistory.vue`.
 *
 * Gère la liste des séances (chargement/erreur/pagination), les filtres
 * (période + recherche débouncée), l'ouverture de la modale de présences
 * (chargement par séance, y compris ouverture directe par route), les exports
 * PDF/Excel et la suppression. La vue ne fait plus que câbler les sous-composants.
 *
 * Parité (#H7) :
 * - $toast résolu via getCurrentInstance comme dans le reste du code converti
 *   (SeanceManagement.vue) ; il n'est PAS enregistré globalement (cf. main.js),
 *   donc `$toast` vaut `undefined`. Les appels NON optionnels de deleteSeance
 *   (`$toast.success/.error`) lèvent donc quand on les atteint — bug latent
 *   PRÉEXISTANT conservé à l'identique. Les exports gardent l'appel optionnel.
 * - formatDate/formatTime/formatDuration restent LOCAUX (non convergés vers
 *   @/utils/formatters) pour un rendu strictement inchangé.
 * - getInitials et formatDateInput étaient des méthodes MORTES (jamais appelées)
 *   dans le composant d'origine : conservées telles quelles (dette documentée).
 */
export function useSeanceAttendanceHistory() {
  // Instance pour le pont route + $toast (non enregistré → undefined, cf. parité supra).
  const instance = getCurrentInstance()
  // Pont route double source : proxy.$route (tests de vue + prod) ; useRoute() (tests de
  // composable mockant vue-router) ; repli sûr pour ne jamais crasher. Voir specs decomposition-300.
  const route = instance?.proxy?.$route ?? useRoute() ?? { params: {}, query: {} }
  const $toast = instance?.appContext.config.globalProperties.$toast

  const loading = ref(false)
  const error = ref(null)
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
  const exporting = ref(false)

  async function loadSeances(page = 1) {
    loading.value = true
    error.value = null

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

      if (response.success) {
        seances.value = response.data
        pagination.value = response.pagination
      }
    } catch (err) {
      error.value = err.message || 'Erreur lors du chargement des séances'
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
      loadingAttendances.value = true
      attendances.value = null
      attendancesError.value = null

      try {
        const response = await lmsService.getSeanceAttendances(seanceId)
        if (response.success) {
          attendances.value = response
          // Mettre à jour les infos de la séance depuis la réponse
          if (response.seance) {
            selectedSeance.value = {
              ...selectedSeance.value,
              matiere_nom: response.seance.matiere_nom || '',
              date: response.seance.date || '',
              enseignant_nom: response.seance.enseignant_nom || '',
              klassci_seance_id: response.seance.klassci_seance_id || seanceId
            }
          }
        }
      } catch (err) {
        attendancesError.value = err.message || 'Erreur lors du chargement des présences'
      } finally {
        loadingAttendances.value = false
      }
    }
  }

  async function viewAttendances(seance) {
    selectedSeance.value = seance
    loadingAttendances.value = true
    attendances.value = null
    attendancesError.value = null

    try {
      const response = await lmsService.getSeanceAttendances(seance.id)
      if (response.success) {
        attendances.value = response
      }
    } catch (err) {
      attendancesError.value = err.message || 'Erreur lors du chargement des présences'
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
      await attendanceExportService.exportPdf(selectedSeance.value.klassci_seance_id)
    } catch (error) {
      console.error('[SeanceHistory] Erreur export PDF:', error)
      $toast?.error('Erreur lors de l\'export PDF : ' + error.message)
    } finally {
      exporting.value = false
    }
  }

  async function exportExcel() {
    if (exporting.value || !selectedSeance.value) return
    exporting.value = true
    try {
      await attendanceExportService.exportExcel(selectedSeance.value.klassci_seance_id)
    } catch (error) {
      console.error('[SeanceHistory] Erreur export Excel:', error)
      $toast?.error('Erreur lors de l\'export Excel : ' + error.message)
    } finally {
      exporting.value = false
    }
  }

  async function deleteSeance(seance) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la séance ${seance.klassci_seance_id} ?`)) {
      return
    }

    try {
      await lmsService.deleteSeance(seance.id)
      $toast.success('Séance supprimée avec succès')
      loadSeances() // Recharger la liste
    } catch (err) {
      $toast.error(err.message || 'Erreur lors de la suppression de la séance')
    }
  }

  function formatDate(dateString) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  function formatTime(dateString) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
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
    loading, error, seances, pagination,
    selectedPeriod, periodTabs, customDates, searchQuery,
    selectedSeance, loadingAttendances, attendances, attendancesError, exporting,
    loadSeances, selectPeriod, applyCustomDates, debouncedSearch, clearSearch,
    changePage, openSeanceById, viewAttendances, closeModal,
    exportPDF, exportExcel, deleteSeance,
    formatDate, formatTime, formatDateInput, formatDuration, getInitials
  }
}
