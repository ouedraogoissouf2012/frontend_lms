import { ref } from 'vue'
import lmsService from '@/services/lms'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/services/toast'
import { normalizeError } from '@/services/errorHandler'
import { useVisioStore } from '@/stores/visio'
import { buildJitsiUrl } from '@/constants/visio'
import { apiBaseUrl } from '@/constants/http'

/**
 * Composable d'actions visio (extrait de VisioManager.vue, G8).
 *
 * Encapsule l'état `loading` / `participantCount` et l'orchestration des appels
 * (programmer / désactiver / démarrer / terminer / télécharger PDF / rejoindre /
 * charger le compteur). Comportement strictement identique : mêmes appels
 * services, mêmes payloads, mêmes alert/confirm/console, mêmes événements émis.
 *
 * @param {{ seance: Object }} props - props réactives du composant (lit props.seance).
 * @param {(event: string, ...args: any[]) => void} emit - fonction emit du setup.
 */
export function useVisioActions(props, emit) {
  // Store Pinia global : persiste lors de la navigation entre pages.
  const visioStore = useVisioStore()

  const loading = ref(false)
  const participantCount = ref(0)

  /**
   * Coordinateur: Programmer la visio
   */
  async function programmerVisio() {
    if (!confirm('Voulez-vous programmer une visioconférence Jitsi pour cette séance ?')) {
      return
    }

    loading.value = true
    try {
      const response = await lmsService.toggleVisio(props.seance.id, true, 'jitsi')

      if (response && response.success) {
        emit('visio-updated', response.data)
        alert('Visioconférence programmée avec succès!')
      } else {
        throw new Error(response?.message || 'Erreur lors de la programmation')
      }
    } catch (error) {
      console.error('[VisioManager] Erreur programmation visio:', error)
      toast.error(error.userMessage ?? normalizeError(error).userMessage)
    } finally {
      loading.value = false
    }
  }

  /**
   * Coordinateur: Désactiver la visio
   */
  async function desactiverVisio() {
    if (!confirm('Voulez-vous désactiver la visioconférence pour cette séance ?')) {
      return
    }

    loading.value = true
    try {
      const response = await lmsService.toggleVisio(props.seance.id, false)

      if (response && response.success) {
        emit('visio-updated', response.data)
        alert('Visioconférence désactivée avec succès!')
      } else {
        throw new Error(response?.message || 'Erreur lors de la désactivation')
      }
    } catch (error) {
      console.error('[VisioManager] Erreur désactivation visio:', error)
      toast.error(error.userMessage ?? normalizeError(error).userMessage)
    } finally {
      loading.value = false
    }
  }

  /**
   * Enseignant: Démarrer la visio (window.open avec tracking)
   */
  async function demarrerVisio() {
    loading.value = true
    try {
      console.log('🎥 Démarrage visio par enseignant...')

      // 1. Démarrer la visio (change status à 'active')
      const result = await lmsService.startVisio(props.seance.id)

      if (!result.success) {
        alert(`Erreur: ${result.message}`)
        return
      }

      // 2. Récupérer le lien Jitsi
      const roomId = result.data.visio_room_id || props.seance.visio?.room_id
      const jitsiLink = buildJitsiUrl(roomId)

      // 3. Utiliser le store pour ouvrir et tracker
      await visioStore.joinVisio(props.seance.id, jitsiLink)

      console.log('✅ Visio démarrée avec window.open + tracking')

      // 4. Rafraîchir les données
      emit('visio-updated', result.data)

    } catch (error) {
      console.error('[VisioManager] Erreur démarrage visio:', error)
      toast.error(error.userMessage ?? normalizeError(error).userMessage)
    } finally {
      loading.value = false
    }
  }

  /**
   * Enseignant: Terminer la séance pour tous les participants
   * Ferme immédiatement tous les participants avec leurs heures réelles
   */
  async function terminerPourTous() {
    const confirmer = confirm(
      '🔚 Voulez-vous vraiment terminer cette séance pour TOUS les participants ?\n\n' +
      '✅ Chaque participant sera déconnecté avec son heure réelle de départ.\n' +
      '❌ Cette action est irréversible.'
    )

    if (!confirmer) return

    loading.value = true
    try {
      console.log('🔚 Fermeture de la séance pour tous...')

      // Appeler endVisio() qui ferme tous les participants
      const response = await lmsService.endVisio(props.seance.id)

      if (response.success) {
        console.log('✅ Séance fermée avec succès')
        alert(`✅ Séance terminée !\n\n${response.data.participants_disconnected} participant(s) déconnecté(s) avec leurs heures réelles.`)

        // Rafraîchir les données
        emit('visio-updated', { ...props.seance, visio_active: false })
      } else {
        throw new Error(response.message || 'Erreur lors de la fermeture')
      }
    } catch (error) {
      console.error('[VisioManager] Erreur fermeture séance:', error)
      toast.error(error.userMessage ?? normalizeError(error).userMessage)
    } finally {
      loading.value = false
    }
  }

  /**
   * Télécharger la liste de présence en PDF
   */
  async function telechargerPresences() {
    loading.value = true
    try {
      console.log('[VisioManager] Téléchargement liste de présence PDF...')

      const API_URL = apiBaseUrl()
      const token = useAuthStore().token

      // Créer l'URL de téléchargement
      const url = `${API_URL}/lms/seances/${props.seance.id}/export/presences/pdf`

      // Télécharger le fichier
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erreur lors du téléchargement du PDF')
      }

      // Créer un blob et télécharger
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `presences_seance_${props.seance.id}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      console.log('[VisioManager] ✅ PDF téléchargé avec succès')
    } catch (error) {
      console.error('[VisioManager] Erreur téléchargement PDF:', error)
      toast.error(error.userMessage ?? normalizeError(error).userMessage)
    } finally {
      loading.value = false
    }
  }

  /**
   * Étudiant: Rejoindre la visio (window.open avec tracking)
   */
  async function rejoindreVisio() {
    if (!props.seance.visio_active) {
      alert('La visio n\'est pas encore démarrée par l\'enseignant')
      return
    }

    loading.value = true
    try {
      console.log('👨‍🎓 Étudiant rejoint la visio...')

      // Room ID depuis la séance
      const roomId = props.seance.visio_room_id || props.seance.visio?.room_id

      if (!roomId) {
        alert('Erreur: Room ID introuvable')
        return
      }

      // Utiliser le store pour ouvrir et tracker
      const jitsiLink = buildJitsiUrl(roomId)
      await visioStore.joinVisio(props.seance.id, jitsiLink)

      console.log('✅ Étudiant a rejoint avec window.open + tracking')

      // Émettre événement pour rafraîchir le compteur de participants
      emit('participant-joined')

    } catch (error) {
      console.error('[VisioManager] Erreur rejoindre visio:', error)
      const errorMessage = error.response?.data?.message || error.message
      alert('Erreur lors de la connexion à la visio: ' + errorMessage)
    } finally {
      loading.value = false
    }
  }

  /**
   * Charger le nombre de participants
   */
  async function loadParticipantCount() {
    try {
      const response = await lmsService.getSeanceParticipants(props.seance.id)
      if (response && response.success) {
        participantCount.value = response.data.total || 0
      }
    } catch (error) {
      console.error('[VisioManager] Erreur chargement participants:', error)
    }
  }

  return {
    loading,
    participantCount,
    programmerVisio,
    desactiverVisio,
    demarrerVisio,
    terminerPourTous,
    telechargerPresences,
    rejoindreVisio,
    loadParticipantCount
  }
}
