import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import lmsService from '@/services/lms'
import { auth } from '@/services/api'
import { toast } from '@/composables/useToast'
import { normalizeError } from '@/services/errorHandler'
import { hasRole, isStudent as roleIsStudent, isTeacher as roleIsTeacher, ROLES } from '@/constants/roles'
import { isVisioRecordingProviderEnabled } from '@/constants/visio'
import { useTrackedVisioJoin } from '@/composables/useTrackedVisioJoin'
import { useVisioRecordingControls } from '@/composables/useVisioRecordingControls'
import {
  confirmVisioAction,
  notifyVisioError,
  notifyVisioSuccess,
  notifyVisioWarning,
} from '@/services/visioFeedback'

/**
 * Couche données/logique de la vue SeanceDetails (#H6 ≤300).
 *
 * Couche de chargement des détails (LMS), démarrage/jonction visio (lien Jitsi),
 * masquage côté étudiant et formatage date/heure.
 */
export function useSeanceDetails() {
  const route = useRoute()
  const router = useRouter()

  const loading = ref(false)
  const error = ref(null)
  const seance = ref(null)
  const visio = ref(null)
  const participants = ref({
    teacher: null,
    students: [],
    total: 0
  })
  const roomActive = ref(false) // Géré par le LMS (statut room)
  const joiningVisio = ref(false)
  const { joinTrackedVisio } = useTrackedVisioJoin('Utilisateur')

  const seanceId = computed(() => parseInt(route.params.id))

  const user = computed(() => auth.getUser())

  const isTeacher = computed(() => hasRole(user.value, [ROLES.ENSEIGNANT, ROLES.COORDINATEUR]))
  const isStudent = computed(() => roleIsStudent(user.value))

  const canManageRecording = computed(() => roleIsTeacher(user.value))
  const recordingProviderEnabled = computed(() => isVisioRecordingProviderEnabled(visio.value))

  const {
    recordingActionLoading,
    recordingPolling,
    startRecording,
    stopRecording,
  } = useVisioRecordingControls({
    seanceId,
    visio,
    canManageRecording,
    recordingProviderEnabled,
  })

  async function loadSeanceDetails() {
    loading.value = true
    error.value = null

    try {
      console.log('fa-calendar Chargement détails séance:', seanceId.value)

      const data = await lmsService.getSeanceDetails(seanceId.value)

      console.log('fa-check-circle Données séance reçues:', data)

      if (data.success) {
        seance.value = data.data.seance
        visio.value = data.data.visio

        // Les participants ne sont retournés QUE pour les enseignants/coordinateurs
        // Pour les étudiants, participants sera undefined
        if (data.data.participants) {
          participants.value = data.data.participants
        } else {
          // Garder les valeurs par défaut pour les étudiants
          participants.value = {
            teacher: null,
            students: [],
            total: 0
          }
        }

        // Vérifier si la room est accessible (nouveau champ is_accessible)
        roomActive.value = visio.value?.window?.is_accessible || false

        console.log('📹 Visio:', visio.value?.enabled ? 'Activée' : 'Désactivée')
        console.log('📹 Status:', visio.value?.status || 'null')
        console.log('fa-clock-o Fenêtre accessible:', roomActive.value)
        console.log('fa-users Participants inclus:', data.data.participants ? 'Oui (enseignant)' : 'Non (étudiant)')
      } else {
        error.value = 'Séance non trouvée'
      }
    } catch (err) {
      console.error('fa-times-circle Erreur chargement séance:', err)
      error.value = 'Erreur lors du chargement de la séance'
    } finally {
      loading.value = false
    }
  }

  async function startVisio() {
    if (!user.value) {
      notifyVisioWarning('Vous devez être connecté.')
      return
    }

    try {
      console.log('🎥 Démarrage visio par enseignant...')

      // 1. Démarrer la visio (change status à 'active')
      const result = await lmsService.startVisio(seanceId.value)

      console.log('fa-check-circle Visio démarrée:', result)

      if (!result.success) {
        notifyVisioError(new Error(result.message || 'Impossible de démarrer la visioconférence'))
        return
      }

      // 2. Rejoindre avec tracking global (participation + heartbeat + beacon)
      await joinTrackedVisio(seance.value || { id: seanceId.value }, {
        roomSource: result.data,
        displayName: user.value.name,
      })

      // 3. Marquer comme active localement
      roomActive.value = true

      // Recharger les détails pour voir le nouveau status
      await loadSeanceDetails()

      notifyVisioSuccess('Visioconférence démarrée. Les étudiants peuvent maintenant rejoindre.')
    } catch (err) {
      console.error('Erreur démarrage visio:', err)
      notifyVisioError(err, 'Erreur lors du démarrage de la visioconférence')
    }
  }

  async function joinVisio() {
    if (!user.value) {
      notifyVisioWarning('Vous devez être connecté.')
      return
    }

    // Vérifier si la visio est activée ET active (status = 'active')
    if (!visio.value || !visio.value.enabled) {
      notifyVisioWarning('La visioconférence n\'est pas activée pour cette séance.')
      return
    }

    if (visio.value.status !== 'active') {
      notifyVisioWarning('La visioconférence n\'est pas encore active. Veuillez attendre que l\'enseignant démarre le cours.')
      return
    }

    joiningVisio.value = true

    try {
      console.log('👨‍fa-graduation-cap Étudiant rejoint la visio...')

      await joinTrackedVisio(seance.value || { id: seanceId.value }, {
        roomSource: visio.value,
        displayName: user.value.name,
      })

      console.log('fa-check-circle Utilisateur a rejoint la visio avec tracking global')
    } catch (err) {
      console.error('fa-times-circle Erreur rejoindre visio:', err)

      // Afficher un message d'erreur plus détaillé
      let errorMessage = err.message || 'Erreur lors de la connexion à la visioconférence.'

      if (err.response && err.response.data) {
        const data = err.response.data
        if (data.message) {
          errorMessage = data.message
        } else if (data.reason) {
          const errorMessages = {
            'visio_not_enabled': 'La visioconférence n\'est pas activée.',
            'visio_not_started': 'La visioconférence n\'a pas encore démarré.',
            'not_enrolled': 'Vous n\'êtes pas inscrit dans cette classe.',
            'seance_not_found': 'Séance non trouvée dans le système.'
          }
          errorMessage = errorMessages[data.reason] || data.reason
        }
      }

      notifyVisioError(new Error(errorMessage), 'Erreur lors de la connexion à la visioconférence')
    } finally {
      joiningVisio.value = false
    }
  }

  function formatDate(date) {
    if (!date) return 'Non défini'
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  async function hideSeance() {
    if (!await confirmVisioAction('Voulez-vous vraiment masquer cette séance de votre liste ?', {
      title: 'Masquer la séance',
      confirmLabel: 'Masquer',
    })) {
      return
    }

    try {
      const id = seance.value.id || seance.value.klassci_seance_id
      const response = await lmsService.hideSeance(id)

      if (response.success) {
        toast.success('Séance masquée avec succès')
        // Retourner à la page précédente
        router.back()
      }
    } catch (err) {
      console.error('[SeanceDetails] Erreur masquage séance:', err)
      toast.error(err.userMessage ?? normalizeError(err).userMessage)
    }
  }

  function formatTime(isoTimestamp) {
    if (!isoTimestamp) return 'Non défini'
    return new Date(isoTimestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  onMounted(() => {
    loadSeanceDetails()
    // Polling pour vérifier le statut de la room (optionnel)
    // this.startRoomStatusPolling()
  })

  return {
    loading, error, seance, visio, participants, roomActive, joiningVisio,
    recordingActionLoading, recordingPolling,
    seanceId, user, isTeacher, isStudent, canManageRecording, recordingProviderEnabled,
    loadSeanceDetails, startVisio, joinVisio,
    startRecording, stopRecording, hideSeance, formatDate, formatTime
  }
}
