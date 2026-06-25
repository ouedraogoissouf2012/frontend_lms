import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import lmsService from '@/services/lms'
import { auth } from '@/services/api'
import { toast } from '@/services/toast'
import { normalizeError } from '@/services/errorHandler'
import { useVisioParticipation } from '@/composables/useVisioParticipation'

/**
 * Couche données/logique de la vue SeanceDetails (#H6 ≤300).
 *
 * Extraite VERBATIM du god-component Options API `SeanceDetails.vue` :
 * chargement des détails (LMS), démarrage/jonction visio (lien Jitsi),
 * masquage côté étudiant et formatage date/heure. Comportement, logs, alertes
 * et appels services strictement identiques.
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
  let visioParticipation = null  // Composable pour le tracking
  // Dette pré-existante : `visioWindow` n'était jamais déclaré dans data() et
  // watchVisioWindow()/leaveVisio() ne sont appelés nulle part → code inerte,
  // conservé à l'identique (cf. commit) plutôt que supprimé.
  let visioWindow = null

  const seanceId = computed(() => parseInt(route.params.id))

  const user = computed(() => auth.getUser())

  const isTeacher = computed(() =>
    user.value && ['enseignant', 'coordinateur', 'teacher'].includes(user.value.role)
  )

  // Accepter à la fois 'etudiant' (sans accent) et 'étudiant' (avec accent)
  const isStudent = computed(() =>
    user.value && ['etudiant', 'étudiant', 'student'].includes(user.value.role)
  )

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
      alert('Vous devez être connecté')
      return
    }

    try {
      console.log('🎥 Démarrage visio par enseignant...')

      // 1. Démarrer la visio (change status à 'active')
      const result = await lmsService.startVisio(seanceId.value)

      console.log('fa-check-circle Visio démarrée:', result)

      if (!result.success) {
        alert(`Erreur: ${result.message}`)
        return
      }

      // 2. Générer lien Jitsi avec modération
      const roomId = result.data.visio_room_id || visio.value.room_id
      const link = `https://meet.jit.si/${roomId}#config.prejoinConfig.enabled=false&userInfo.displayName=${encodeURIComponent(user.value.name)}`

      // 3. Marquer comme active localement
      roomActive.value = true

      // Recharger les détails pour voir le nouveau status
      await loadSeanceDetails()

      // 4. Ouvrir Jitsi
      window.open(link, '_blank')

      alert('Visioconférence démarrée ! Les étudiants peuvent maintenant rejoindre.')
    } catch (err) {
      console.error('Erreur démarrage visio:', err)
      alert('Erreur lors du démarrage de la visioconférence')
    }
  }

  async function joinVisio() {
    if (!user.value) {
      alert('Vous devez être connecté')
      return
    }

    // Vérifier si la visio est activée ET active (status = 'active')
    if (!visio.value || !visio.value.enabled) {
      alert('La visioconférence n\'est pas activée pour cette séance.')
      return
    }

    if (visio.value.status !== 'active') {
      alert('La visioconférence n\'est pas encore active. Veuillez attendre que l\'enseignant démarre le cours.')
      return
    }

    joiningVisio.value = true

    try {
      console.log('👨‍fa-graduation-cap Étudiant rejoint la visio...')

      // Initialiser le composable si pas déjà fait
      if (!visioParticipation) {
        visioParticipation = useVisioParticipation(seanceId.value)
      }

      // Récupérer le room_id depuis la visio
      const roomId = visio.value?.room_id || `seance_${seanceId.value}`

      // Générer lien Jitsi
      const displayName = encodeURIComponent(user.value.name)
      const link = `https://meet.jit.si/${roomId}#config.prejoinConfig.enabled=false&userInfo.displayName=${displayName}`

      console.log('🔗 Lien Jitsi:', link)

      // Utiliser le composable pour ouvrir et tracker
      await visioParticipation.joinVisio(link)

      console.log('fa-check-circle Étudiant a rejoint la visio avec Web Worker heartbeat')
    } catch (err) {
      console.error('fa-times-circle Erreur rejoindre visio:', err)

      // Afficher un message d'erreur plus détaillé
      let errorMessage = 'Erreur lors de la connexion à la visioconférence.'

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

      alert(`fa-times-circle ${errorMessage}`)
    } finally {
      joiningVisio.value = false
    }
  }

  /**
   * Surveiller la fermeture de la fenêtre Jitsi (dette pré-existante : inerte).
   */
  function watchVisioWindow() {
    if (!visioWindow) return

    const checkClosed = setInterval(() => {
      if (visioWindow.closed) {
        clearInterval(checkClosed)
        console.log('🚪 Fenêtre Jitsi fermée, enregistrement sortie')
        leaveVisio()
        visioWindow = null
      }
    }, 1000) // Vérifier toutes les secondes
  }

  /**
   * Enregistrer la sortie de la visio (dette pré-existante : inerte).
   */
  async function leaveVisio() {
    try {
      const response = await lmsService.leaveVisio(seanceId.value)
      console.log('👋 Sortie de visio enregistrée:', response)
    } catch (err) {
      console.error('fa-times-circle Erreur leave visio:', err)
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
    if (!confirm('Voulez-vous vraiment masquer cette séance de votre liste ?')) {
      return
    }

    try {
      const id = seance.value.id || seance.value.klassci_seance_id
      const response = await lmsService.hideSeance(id)

      if (response.success) {
        alert('fa-check Séance masquée avec succès')
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
    seanceId, user, isTeacher, isStudent,
    loadSeanceDetails, startVisio, joinVisio, watchVisioWindow, leaveVisio,
    hideSeance, formatDate, formatTime
  }
}
