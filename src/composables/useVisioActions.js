import { ref } from 'vue'
import lmsService from '@/services/lms'
import { useAuthStore } from '@/stores/auth'
import { useVisioStore } from '@/stores/visio'
import { requireVisioRoomId } from '@/constants/visio'
import { apiBaseUrl } from '@/constants/http'
import {
  confirmVisioAction,
  notifyVisioError,
  notifyVisioSuccess,
  notifyVisioWarning,
} from '@/services/visioFeedback'

/**
 * Composable d'actions visio (extrait de VisioManager.vue, G8).
 *
 * Encapsule l'état `loading` / `participantCount` et l'orchestration des appels
 * (programmer / désactiver / démarrer / terminer / télécharger PDF / rejoindre /
 * charger le compteur). Les appels services et événements restent stables ; les
 * retours utilisateur passent par les toasts et confirmations modales du projet.
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
    if (!await confirmVisioAction('Voulez-vous programmer une visioconférence Jitsi pour cette séance ?')) {
      return
    }

    loading.value = true
    try {
      const response = await lmsService.toggleVisio(props.seance.id, true, 'jitsi')

      if (response && response.success) {
        emit('visio-updated', response.data)
        notifyVisioSuccess('Visioconférence programmée avec succès.')
      } else {
        throw new Error(response?.message || 'Erreur lors de la programmation')
      }
    } catch (error) {
      console.error('[VisioManager] Erreur programmation visio:', error)
      notifyVisioError(error, 'Erreur lors de la programmation')
    } finally {
      loading.value = false
    }
  }

  /**
   * Coordinateur: Désactiver la visio
   */
  async function desactiverVisio() {
    if (!await confirmVisioAction('Voulez-vous désactiver la visioconférence pour cette séance ?', {
      variant: 'danger',
    })) {
      return
    }

    loading.value = true
    try {
      const response = await lmsService.toggleVisio(props.seance.id, false)

      if (response && response.success) {
        emit('visio-updated', response.data)
        notifyVisioSuccess('Visioconférence désactivée avec succès.')
      } else {
        throw new Error(response?.message || 'Erreur lors de la désactivation')
      }
    } catch (error) {
      console.error('[VisioManager] Erreur désactivation visio:', error)
      notifyVisioError(error, 'Erreur lors de la désactivation')
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
        notifyVisioError(new Error(result.message || 'Impossible de démarrer la visio'))
        return
      }

      // 2. Garde AVANT tout appel réseau : une séance sans salle doit échouer
      //    ici, jamais après `join` qui écrit déjà la présence en base (#469).
      requireVisioRoomId(result.data)

      // 3. Le store construit l'URL depuis SA propre réponse — seule source
      //    qui porte aussi le jeton d'accès exigé par le serveur.
      await visioStore.joinVisio(props.seance.id)

      console.log('✅ Visio démarrée avec window.open + tracking')

      // 4. Rafraîchir les données
      emit('visio-updated', result.data)

    } catch (error) {
      console.error('[VisioManager] Erreur démarrage visio:', error)
      notifyVisioError(error, 'Erreur lors du démarrage de la visio')
    } finally {
      loading.value = false
    }
  }

  /**
   * Enseignant: Terminer la séance pour tous les participants
   * Ferme immédiatement tous les participants avec leurs heures réelles
   */
  async function terminerPourTous() {
    const confirmer = await confirmVisioAction(
      '🔚 Voulez-vous vraiment terminer cette séance pour TOUS les participants ?\n\n' +
      '✅ Chaque participant sera déconnecté avec son heure réelle de départ.\n' +
      '❌ Cette action est irréversible.',
      {
        confirmLabel: 'Terminer pour tous',
        variant: 'danger',
      }
    )

    if (!confirmer) return

    loading.value = true
    try {
      console.log('🔚 Fermeture de la séance pour tous...')

      // Appeler endVisio() qui ferme tous les participants
      const response = await lmsService.endVisio(props.seance.id)

      if (response.success) {
        console.log('✅ Séance fermée avec succès')
        notifyVisioSuccess(
          `Séance terminée : ${response.data.participants_disconnected} participant(s) déconnecté(s).`
        )

        // Rafraîchir les données
        emit('visio-updated', { ...props.seance, visio_active: false })
      } else {
        throw new Error(response.message || 'Erreur lors de la fermeture')
      }
    } catch (error) {
      console.error('[VisioManager] Erreur fermeture séance:', error)
      notifyVisioError(error, 'Erreur lors de la fermeture')
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
      notifyVisioError(error, 'Erreur lors du téléchargement du PDF')
    } finally {
      loading.value = false
    }
  }

  /**
   * Étudiant: Rejoindre la visio (window.open avec tracking)
   */
  async function rejoindreVisio() {
    if (!props.seance.visio_active) {
      notifyVisioWarning('La visio n\'est pas encore démarrée par l\'enseignant.')
      return
    }

    loading.value = true
    try {
      console.log('👨‍🎓 Étudiant rejoint la visio...')

      // Garde AVANT tout appel réseau : sans salle, on échoue ici et non après
      // `join`, qui écrit déjà la présence en base (#469).
      requireVisioRoomId(props.seance)

      // Le store construit l'URL depuis SA réponse, qui porte le jeton d'accès.
      await visioStore.joinVisio(props.seance.id)

      console.log('✅ Étudiant a rejoint avec window.open + tracking')

      // Émettre événement pour rafraîchir le compteur de participants
      emit('participant-joined')

    } catch (error) {
      console.error('[VisioManager] Erreur rejoindre visio:', error)
      notifyVisioError(error, 'Erreur lors de la connexion à la visio')
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
