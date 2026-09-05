import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTrackedVisioJoin } from '@/composables/useTrackedVisioJoin'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/composables/useToast'
import { normalizeError } from '@/services/errorHandler'
import lmsService from '@/services/lms'
import { clearCacheByPrefix } from '@/services/cache'
import { getVisioRoomId } from '@/constants/visio'
import { useCoordinatorSeances } from '@/composables/useCoordinatorSeances'
import { confirmVisioAction } from '@/services/visioFeedback'

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

  const { joinTrackedVisio } = useTrackedVisioJoin('Coordinateur')

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
          seance.visio_room_id = getVisioRoomId(response.data)
        }

        // Purge après maj : la clé séances est scopée par `days` (#315), donc on
        // vide TOUTES les variantes `seances_management_d*`, pas une clé fixe.
        clearCacheByPrefix('seances_management')

        toast.success(response.message || 'Visioconférence mise à jour')
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch (err) {
      console.error('[ERREUR] Toggle visio:', err)
      toast.error('Erreur lors de l\'activation/désactivation de la visio')
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

      await joinTrackedVisio(seance, {
        displayName: currentUser?.name || 'Coordinateur',
      })

      console.log('[VISIO] Coordinateur a rejoint avec window.open + tracking Web Worker')

      // Rafraîchir les séances
      await loadSeances()
    } catch (error) {
      console.error('[ERREUR] Join visio coordinateur:', error)
      toast.error(error.userMessage ?? error.message ?? normalizeError(error).userMessage)
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
          toast.success(newState ? 'Visio activee' : 'Visio desactivee')
        } catch (error) {
          console.error('[CoordinatorSeances] Erreur toggle visio:', error)
          toast.error('Erreur lors de la modification')
        }
        break

      case 'joinVisio':
        await handleJoinVisio(data)
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
        if (await confirmVisioAction('Voulez-vous vraiment supprimer cette seance ?', {
          title: 'Supprimer la séance',
          confirmLabel: 'Supprimer',
          variant: 'danger',
        })) {
          try {
            await lmsService.deleteSeance(data.id)
            if (calendarRef.value?.refreshEvents) {
              await calendarRef.value.refreshEvents()
            }
            toast.success('Seance supprimee')
          } catch (error) {
            console.error('[CoordinatorSeances] Erreur suppression:', error)
            toast.error('Erreur lors de la suppression')
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
