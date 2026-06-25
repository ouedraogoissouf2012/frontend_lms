import { ref, reactive, computed, onMounted } from 'vue'
import lmsService from '@/services/lms'
import { auth } from '@/services/api'

/**
 * Couche données de l'historique des présences (H7, ≤300) extraite de
 * `views/attendance/AttendanceHistory.vue`.
 *
 * Gère l'état (chargement/erreur/liste/pagination), les filtres (dates + séance),
 * les valeurs dérivées (moyenne, comptes connecté/déconnecté) et l'export CSV.
 * La vue ne fait plus que câbler les sous-composants.
 *
 * NB parité : les formateurs date/heure restent LOCAUX (heure avec secondes),
 * distincts de `@/utils/formatters` — duplication préexistante conservée à
 * l'identique (#H7) pour garantir un rendu strictement inchangé.
 */
export function useAttendanceHistory() {
  const loading = ref(false)
  const error = ref(null)
  const attendances = ref([])
  const pagination = ref({
    current_page: 1,
    per_page: 50,
    total: 0,
    last_page: 1
  })
  const filters = reactive({
    dateFrom: '',
    dateTo: '',
    seanceId: ''
  })
  const selectedAttendance = ref(null)
  let debounceTimer = null

  const user = computed(() => auth.getUser())

  const averageDuration = computed(() => {
    const validDurations = attendances.value.filter(a => a.duration_minutes)
    if (validDurations.length === 0) return 0
    const sum = validDurations.reduce((acc, a) => acc + a.duration_minutes, 0)
    return Math.round(sum / validDurations.length)
  })

  const connectedCount = computed(() =>
    attendances.value.filter(a => a.status === 'connected').length
  )

  const disconnectedCount = computed(() =>
    attendances.value.filter(a => a.status === 'disconnected').length
  )

  async function loadHistory(page = 1) {
    loading.value = true
    error.value = null

    try {
      const params = {
        page,
        per_page: pagination.value.per_page
      }

      if (filters.dateFrom) {
        params.date_from = filters.dateFrom
      }

      if (filters.dateTo) {
        params.date_to = filters.dateTo
      }

      if (filters.seanceId) {
        params.seance_id = filters.seanceId
      }

      const response = await lmsService.getAttendanceHistory(params)

      if (response.success) {
        attendances.value = response.data
        pagination.value = response.pagination
      } else {
        throw new Error(response.message || 'Erreur lors du chargement de l\'historique')
      }
    } catch (err) {
      console.error('[AttendanceHistory] Erreur:', err)
      error.value = err.response?.data?.message || err.message || 'Erreur lors du chargement de l\'historique'
    } finally {
      loading.value = false
    }
  }

  function loadPage(page) {
    if (page >= 1 && page <= pagination.value.last_page) {
      loadHistory(page)
    }
  }

  function resetFilters() {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    filters.dateFrom = formatDateInput(thirtyDaysAgo)
    filters.dateTo = formatDateInput(today)
    filters.seanceId = ''

    loadHistory()
  }

  function debouncedLoad() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      loadHistory()
    }, 500)
  }

  function viewDetails(attendance) {
    selectedAttendance.value = attendance
  }

  function closeDetails() {
    selectedAttendance.value = null
  }

  function exportToCSV() {
    const headers = [
      'Date',
      'Heure',
      'Participant',
      'Email',
      'Séance ID',
      'Matière',
      'Classe',
      'Statut',
      'Durée (min)',
      'Connexion',
      'Déconnexion'
    ]

    const rows = attendances.value.map(a => [
      formatDate(a.joined_at),
      formatTime(a.joined_at),
      a.user.name,
      a.user.email,
      a.seance.klassci_seance_id,
      a.seance.matiere?.nom || '-',
      a.seance.classe?.nom || '-',
      a.status === 'connected' ? 'Connecté' : 'Déconnecté',
      a.duration_minutes || '-',
      formatDateTime(a.joined_at),
      a.left_at ? formatDateTime(a.left_at) : 'En cours'
    ])

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `historique_presences_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  function formatDate(dateString) {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  function formatTime(dateString) {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  function formatDateTime(dateString) {
    if (!dateString) return '-'
    return `${formatDate(dateString)} ${formatTime(dateString)}`
  }

  function formatDateInput(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  onMounted(() => {
    // Set default date range (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    filters.dateFrom = formatDateInput(thirtyDaysAgo)
    filters.dateTo = formatDateInput(today)

    loadHistory()
  })

  return {
    loading, error, attendances, pagination, filters, selectedAttendance,
    user, averageDuration, connectedCount, disconnectedCount,
    loadHistory, loadPage, resetFilters, debouncedLoad,
    viewDetails, closeDetails, exportToCSV,
    formatDate, formatTime, formatDateTime
  }
}
