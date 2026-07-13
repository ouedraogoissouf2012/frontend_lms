import { ref } from 'vue'
import lmsService from '@/services/lms'
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
export function useVisioRecordingControls({ seanceId, visio, canManageRecording }) {
  const recordingActionLoading = ref(false)

  const polling = useVisioRecordingPolling({
    getSeanceId: () => seanceId.value,
    isEnabled: () => Boolean(visio.value?.enabled),
    onStatus: (_normalized, response) => {
      setRecording(visio, resolveVisioRecordingPayload(response))
    },
  })

  async function applyBackendRecording(response) {
    const payload = resolveVisioRecordingPayload(response)
    const normalized = setRecording(visio, payload) ?? await polling.refreshRecording()

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
      const response = await lmsService.startVisioRecording(seanceId.value)
      if (response?.success === false) {
        throw new Error(response.message || "Impossible de démarrer l'enregistrement")
      }
      await applyBackendRecording(response)
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
      const response = await lmsService.stopVisioRecording(seanceId.value)
      if (response?.success === false) {
        throw new Error(response.message || "Impossible d'arrêter l'enregistrement")
      }
      await applyBackendRecording(response)
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
