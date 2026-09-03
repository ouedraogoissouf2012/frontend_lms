import { ref } from 'vue'
import { useVisioStore } from '@/stores/visio'
import { normalizeVisioRecording } from '@/utils/visioRecording'
import {
  resolveVisioRecordingPayload,
  shouldPollVisioRecording,
  useVisioRecordingPolling,
} from '@/composables/useVisioRecordingPolling'
import {
  confirmVisioAction,
  notifyVisioError,
  notifyVisioSuccess,
  notifyVisioWarning,
} from '@/services/visioFeedback'

function canManage(canManageRecording) {
  return typeof canManageRecording === 'function'
    ? Boolean(canManageRecording())
    : Boolean(canManageRecording?.value)
}

function providerReady(recordingProviderEnabled) {
  return typeof recordingProviderEnabled === 'function'
    ? Boolean(recordingProviderEnabled())
    : Boolean(recordingProviderEnabled?.value)
}

function setRecording(visio, payload) {
  if (!payload || !visio.value) return null
  visio.value = { ...visio.value, recording: payload }
  return normalizeVisioRecording({ recording: payload })
}

/**
 * Actions enseignant pour l'enregistrement d'une visio (#199).
 *
 * Le front ne déduit jamais seul un état actif : après start/stop, il applique
 * le payload backend, puis poll le statut tant que celui-ci est non terminal.
 */
/**
 * ⚠️ Le store est résolu PARESSEUSEMENT, au moment de l'action, jamais à la
 * construction. Le remonter en tête du composable exigerait une instance Pinia
 * active partout où `SeanceDetails` est simplement monté — y compris dans des
 * tests de rendu qui ne déclenchent aucun enregistrement. Ce serait élargir le
 * contrat de ce composable sans nécessité.
 */
export function useVisioRecordingControls({
  seanceId,
  visio,
  canManageRecording,
  recordingProviderEnabled,
}) {
  const recordingActionLoading = ref(false)

  const polling = useVisioRecordingPolling({
    getSeanceId: () => seanceId.value,
    isEnabled: () => Boolean(visio.value?.enabled) && providerReady(recordingProviderEnabled),
    onStatus: (_normalized, response) => {
      setRecording(visio, resolveVisioRecordingPayload(response))
    },
  })

  /**
   * Relit l'état d'enregistrement CÔTÉ SERVEUR au lieu de le déduire de la
   * réponse à un ordre.
   *
   * C'est la conséquence directe de #673 : la ligne n'est plus écrite par ce
   * composable mais par le miroir, sur confirmation du fournisseur. Déduire
   * l'état d'un ordre reviendrait à réafficher une intention.
   */
  async function syncFromServer() {
    const normalized = await polling.refreshRecording()

    if (normalized && shouldPollVisioRecording(normalized)) {
      polling.start()
    } else {
      polling.stop()
    }

    return normalized
  }

  function ensureCanRecord() {
    if (!canManage(canManageRecording)) {
      notifyVisioWarning("Vous n'êtes pas autorisé à gérer l'enregistrement.")
      return false
    }
    if (!providerReady(recordingProviderEnabled)) {
      notifyVisioWarning("L'enregistrement n'est pas activé sur cette plateforme.")
      return false
    }
    if (visio.value?.status !== 'active') {
      notifyVisioWarning("L'enregistrement est disponible uniquement pendant une séance active.")
      return false
    }
    return true
  }

  async function startRecording() {
    if (recordingActionLoading.value || !ensureCanRecord()) return

    const confirmed = await confirmVisioAction(
      "Démarrer l'enregistrement de cette séance ? Les participants verront la bannière de consentement.",
      { confirmLabel: 'Démarrer' }
    )
    if (!confirmed) return

    recordingActionLoading.value = true
    try {
      // L'ordre part vers la SALLE, jamais vers la base. C'est Jicofo qui
      // pilote Jibri et qui publie le bandeau de consentement à TOUS les
      // participants ; un appel backend direct écrirait une ligne sans que
      // Jibri en sache quoi que ce soit — le défaut d'origine de #673.
      await useVisioStore().startRoomRecording()
      await syncFromServer()
      notifyVisioSuccess('Enregistrement démarré.')
    } catch (error) {
      notifyVisioError(error, "Erreur lors du démarrage de l'enregistrement")
    } finally {
      recordingActionLoading.value = false
    }
  }

  async function stopRecording() {
    if (recordingActionLoading.value || !ensureCanRecord()) return

    const confirmed = await confirmVisioAction(
      "Arrêter l'enregistrement de cette séance ?",
      { confirmLabel: 'Arrêter', variant: 'danger' }
    )
    if (!confirmed) return

    recordingActionLoading.value = true
    try {
      await useVisioStore().stopRoomRecording()
      await syncFromServer()
      notifyVisioSuccess("Arrêt de l'enregistrement demandé.")
    } catch (error) {
      notifyVisioError(error, "Erreur lors de l'arrêt de l'enregistrement")
    } finally {
      recordingActionLoading.value = false
    }
  }

  return {
    recordingActionLoading,
    recordingPolling: polling.polling,
    recordingPollingError: polling.error,
    refreshRecording: polling.refreshRecording,
    startRecording,
    stopRecording,
    stopRecordingPolling: polling.stop,
  }
}
