import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { useVisioParticipation } from '@/composables/useVisioParticipation'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/services/toast'
import { normalizeError } from '@/services/errorHandler'
import lmsService from '@/services/lms'
import { clearCache } from '@/services/cache'
import { buildJitsiUrl } from '@/constants/visio'
import { useCoordinatorSeances } from '@/composables/useCoordinatorSeances'

/**
 * Couche logique/UI de la vue SeanceManagement (coordinateur) (#H6 ≤300).
 *
 * Compose le composable de données existant `useCoordinatorSeances` (séances,
 * classes, enseignants, filtres + loaders) et y ajoute l'état UI (modes
 * liste/calendrier, modal participants) ainsi que les actions visio
 * (toggle/rejoindre) et le routage des actions du calendrier. Extrait VERBATIM
 * du `<script setup>` d'origine : logs, clés de cache, confirmations et appels
 * services strictement identiques.
 */
export function useSeanceManagement() {
  const router = useRouter()

  // Instance pour accéder à $toast
  const instance = getCurrentInstance()
  const $toast = instance?.appContext.config.globalProperties.$toast

  // Données + appels API (état séances/classes/enseignants/filtres + loaders)
  const {
    loading,
    error,
    seances,
    classes,
    enseignants,
    filters,
    loadClasses,
    loadEnseignants,
    loadSeances
  } = useCoordinatorSeances()

  // État UI local
  const showParticipantsModal = ref(false)
  const selectedSeanceId = ref(null)
  const viewMode = ref('list')
  const calendarRef = ref(null)

  // Get current user for Jitsi (#19 : via store, plus de localStorage('user'))
  const currentUser = useAuthStore().currentUser

  // État de la modal Jitsi
  // visioParticipation sera créé dynamiquement pour chaque séance
  const visioParticipations = reactive({})

  const toggleSeanceVisio = async (seance) => {
    const newState = !seance.visio_enabled

    try {
      console.log(`[VISIO] Toggle séance ${seance.id}: ${newState ? 'ON' : 'OFF'}`)

      const response = await lmsService.toggleVisio(
        seance.id,
        newState,
        seance.visio_type || 'jitsi'
      )

      console.log('[OK] Réponse toggle:', response)

      if (response.success) {
        // Mettre à jour localement
        seance.visio_enabled = newState
        if (!newState) {
          seance.visio_type = null
          seance.visio_room_id = null
        } else {
          seance.visio_room_id = `seance_${seance.id}`
        }

        // Clear cache after update
        clearCache('seances_management')

        $toast?.success(response.message || 'Visioconférence mise à jour')
      } else {
        $toast?.error('Erreur lors de la mise à jour')
      }
    } catch (err) {
      console.error('[ERREUR] Toggle visio:', err)
      $toast?.error('Erreur lors de l\'activation/désactivation de la visio')
    }
  }

  const showParticipants = (seance) => {
    console.log('[PARTICIPANTS] Ouverture modal pour séance:', seance.id)
    selectedSeanceId.value = seance.id
    showParticipantsModal.value = true
  }

  const handleJoinVisio = async (seance) => {
    try {
      console.log('[VISIO] Rejoindre visio coordinateur:', seance.id)

      // Créer le composable pour cette séance si pas déjà créé
      if (!visioParticipations[seance.id]) {
        visioParticipations[seance.id] = useVisioParticipation(seance.id)
      }

      // Ouvrir window.open avec tracking
      const roomId = seance.visio_room_id
      const jitsiLink = buildJitsiUrl(roomId)

      await visioParticipations[seance.id].joinVisio(jitsiLink)

      console.log('[VISIO] Coordinateur a rejoint avec window.open + tracking Web Worker')

      // Rafraîchir les séances
      await loadSeances()
    } catch (error) {
      console.error('[ERREUR] Join visio coordinateur:', error)
      toast.error(error.userMessage ?? normalizeError(error).userMessage)
    }
  }

  // Gestion des actions du calendrier
  async function handleCalendarAction({ type, data }) {
    console.log('[CoordinatorSeances] Calendar action:', type, data)

    switch (type) {
      case 'toggleVisio':
        // Activer/desactiver la visio
        try {
          const newState = !(data.visio?.enabled || data.visio_enabled)
          await lmsService.toggleVisio(data.id, newState, 'jitsi')
          console.log('[CoordinatorSeances] Visio toggled:', data.id, newState)
          if (calendarRef.value?.refreshEvents) {
            await calendarRef.value.refreshEvents()
          }
          $toast?.success(newState ? 'Visio activee' : 'Visio desactivee')
        } catch (error) {
          console.error('[CoordinatorSeances] Erreur toggle visio:', error)
          $toast?.error('Erreur lors de la modification')
        }
        break

      case 'joinVisio':
        // Coordinateur rejoint la visio
        {
          const roomId = data.visio?.room_id || data.visio_room_id || `seance_${data.id}`
          const jitsiLink = buildJitsiUrl(roomId, {
            displayName: currentUser?.name || 'Coordinateur',
            prejoinDisabled: true,
          })
          window.open(jitsiLink, '_blank')
        }
        break

      case 'viewParticipants':
        // Voir les participants
        selectedSeanceId.value = data.id
        showParticipantsModal.value = true
        break

      case 'exportAttendance':
        // Exporter les presences
        router.push(`/attendance/seances/${data.id}?export=true`)
        break

      case 'viewDetails':
        // Voir les details
        router.push(`/seances/${data.id}`)
        break

      case 'delete':
        // Supprimer la seance
        if (confirm('Voulez-vous vraiment supprimer cette seance ?')) {
          try {
            await lmsService.deleteSeance(data.id)
            if (calendarRef.value?.refreshEvents) {
              await calendarRef.value.refreshEvents()
            }
            $toast?.success('Seance supprimee')
          } catch (error) {
            console.error('[CoordinatorSeances] Erreur suppression:', error)
            $toast?.error('Erreur lors de la suppression')
          }
        }
        break

      case 'viewEvaluationResults':
        router.push(`/coordinateur/evaluations/${data.id}/results`)
        break

      case 'editEvaluation':
        router.push(`/coordinateur/evaluations/${data.id}/edit`)
        break

      default:
        console.warn('[CoordinatorSeances] Action non geree:', type)
    }
  }

  // Lifecycle hooks
  onMounted(() => {
    loadClasses()
    loadEnseignants()
    loadSeances()
  })

  return {
    loading, error, seances, classes, enseignants, filters, loadSeances,
    showParticipantsModal, selectedSeanceId, viewMode, calendarRef,
    toggleSeanceVisio, showParticipants, handleJoinVisio, handleCalendarAction,
  }
}
