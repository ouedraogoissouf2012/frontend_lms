import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import lmsService from '@/services/lms'
import attendanceExportService from '@/services/attendanceExport'
import { toast } from '@/composables/useToast'
import { normalizeError } from '@/services/errorHandler'

/**
 * Couche données/logique de ParticipantsModal (#G8/H13 ≤300) : charge la liste de
 * présence d'une séance, gère l'auto-refresh (15 s), les statistiques, le formatage
 * (durée/initiales) et les exports PDF/Excel. Extrait VERBATIM de l'ancien
 * ParticipantsModal.vue (Options API) ; comportement strictement identique.
 *
 * @param {{ value: number }} seanceId - ref du seanceId fourni par la vue parente.
 */
export function useParticipantsModal(seanceId) {
  const loading = ref(true)
  const error = ref(null)
  const students = ref([])
  const teacher = ref(null)
  const coordinator = ref(null)
  const seanceStartTime = ref(null)
  const seanceEndTime = ref(null)
  const stats = ref({
    total_students: 0,
    present_count: 0,
    absent_count: 0,
    presence_rate: 0,
    complete_presence_count: 0,
    late_count: 0,
    left_early_count: 0,
    average_percentage: 0,
    average_duration_minutes: 0,
    seance_duration_minutes: 120
  })
  const exporting = ref(false)
  let refreshInterval = null

  const seanceDuration = computed(() => {
    const minutes = Math.round(stats.value.seance_duration_minutes) // Arrondir les minutes
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
    }
    return `${minutes} min`
  })

  const seanceTime = computed(() => {
    if (seanceStartTime.value && seanceEndTime.value) {
      return `${seanceStartTime.value} - ${seanceEndTime.value}`
    }
    return null
  })

  async function loadParticipants(silent = false) {
    // Ne pas afficher le spinner sur les refreshs automatiques
    if (!silent) {
      loading.value = true
    }
    error.value = null

    try {
      console.log('[ParticipantsModal] Chargement liste de présence pour séance:', seanceId.value)

      // Récupérer la liste unifiée (tous les étudiants avec statut présent/absent)
      const response = await lmsService.getVisioParticipants(seanceId.value)

      console.log('[ParticipantsModal] Réponse:', response)

      if (response && response.success) {
        students.value = response.data.students || []
        stats.value = response.data.statistics || stats.value
        teacher.value = response.data.teacher || null
        coordinator.value = response.data.coordinator || null

        // Extraire les horaires de la séance si disponibles
        if (response.data.seance_info) {
          seanceStartTime.value = response.data.seance_info.heure_debut
          seanceEndTime.value = response.data.seance_info.heure_fin
        }

        console.log('[ParticipantsModal] Liste de présence chargée:', {
          students: students.value.length,
          stats: stats.value,
          teacher: teacher.value,
          coordinator: coordinator.value,
          seanceTime: seanceTime.value
        })
      } else {
        throw new Error(response?.message || 'Erreur lors du chargement de la liste de présence')
      }
    } catch (err) {
      console.error('[ParticipantsModal] Erreur chargement liste de présence:', err)
      error.value = err.response?.data?.message || err.message || 'Erreur inconnue'
    } finally {
      loading.value = false
    }
  }

  /**
   * Formater une durée en minutes vers format lisible
   */
  function formatDuration(minutes) {
    if (!minutes || minutes === 0) return '-'

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0) {
      return `${hours}h${mins.toString().padStart(2, '0')}`
    }
    return `${mins}min`
  }

  /**
   * Obtenir les initiales d'un nom
   * Ex: "Jean Dupont" -> "JD"
   */
  function getInitials(name) {
    if (!name) return '?'

    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  async function exportPDF() {
    if (exporting.value) return
    exporting.value = true
    try {
      await attendanceExportService.exportPdf(seanceId.value)
    } catch (err) {
      toast.error(err.userMessage ?? normalizeError(err).userMessage)
    } finally {
      exporting.value = false
    }
  }

  async function exportExcel() {
    if (exporting.value) return
    exporting.value = true
    try {
      await attendanceExportService.exportExcel(seanceId.value)
    } catch (err) {
      toast.error(err.userMessage ?? normalizeError(err).userMessage)
    } finally {
      exporting.value = false
    }
  }

  onMounted(() => {
    loadParticipants()
    // Auto-refresh toutes les 15 secondes (silencieux)
    refreshInterval = setInterval(() => {
      loadParticipants(true) // silent refresh
    }, 15000)
  })

  onBeforeUnmount(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
  })

  return {
    loading, error, students, teacher, coordinator,
    seanceStartTime, seanceEndTime, stats, exporting,
    seanceDuration, seanceTime,
    loadParticipants, formatDuration, getInitials, exportPDF, exportExcel,
  }
}
