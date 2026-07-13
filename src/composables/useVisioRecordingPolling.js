import { getCurrentScope, onScopeDispose, ref } from 'vue'
import lmsService from '@/services/lms'
import { VISIO_CONFIG } from '@/constants/visio'
import { normalizeVisioRecording, RECORDING_STATUSES } from '@/utils/visioRecording'

const POLLED_STATUSES = new Set([
  RECORDING_STATUSES.RECORDING,
  RECORDING_STATUSES.UPLOADING,
  RECORDING_STATUSES.PROCESSING,
])

export function resolveVisioRecordingPayload(response) {
  if (response?.data?.recording) return response.data.recording
  if (response?.recording) return response.recording
  if (response?.data?.visio?.recording) return response.data.visio.recording
  if (response?.visio?.recording) return response.visio.recording
  if (response?.data && typeof response.data === 'object') return response.data
  return response ?? null
}

export function shouldPollVisioRecording(recording) {
  const status = typeof recording === 'string' ? recording : recording?.status
  return POLLED_STATUSES.has(status)
}

/**
 * Polling contrôlé du statut d'enregistrement visio (#198).
 *
 * La source de vérité reste le backend. Le composable expose un `refreshRecording`
 * manuel et un `start/stop` explicite pour que les écrans coupent le polling au
 * démontage ou dès que l'état devient terminal (ready/failed/idle).
 */
export function useVisioRecordingPolling(options = {}) {
  const getSeanceId = options.getSeanceId ?? (() => null)
  const isEnabled = options.isEnabled ?? (() => true)
  const intervalMs = options.intervalMs ?? VISIO_CONFIG.RECORDING_POLL_INTERVAL_MS
  const service = options.service ?? lmsService

  const rawRecording = ref(null)
  const recording = ref(normalizeVisioRecording(null))
  const loading = ref(false)
  const polling = ref(false)
  const error = ref(null)

  let intervalId = null

  function clearTimer() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function canRequest() {
    return Boolean(getSeanceId()) && isEnabled()
  }

  function stop() {
    polling.value = false
    clearTimer()
  }

  async function refreshRecording() {
    const seanceId = getSeanceId()
    if (!seanceId || !isEnabled()) {
      stop()
      return null
    }

    loading.value = true
    error.value = null

    try {
      const response = await service.getVisioRecording(seanceId)
      const payload = resolveVisioRecordingPayload(response)
      const normalized = normalizeVisioRecording({ recording: payload })

      rawRecording.value = payload
      recording.value = normalized
      options.onStatus?.(normalized, response)

      if (polling.value && !shouldPollVisioRecording(normalized)) {
        stop()
      }

      return normalized
    } catch (err) {
      error.value = err
      options.onError?.(err)
      stop()
      return null
    } finally {
      loading.value = false
    }
  }

  function start() {
    stop()
    if (!canRequest()) return

    polling.value = true
    void refreshRecording()
    intervalId = setInterval(refreshRecording, intervalMs)
  }

  if (getCurrentScope()) {
    onScopeDispose(stop)
  }

  return {
    rawRecording,
    recording,
    loading,
    polling,
    error,
    refreshRecording,
    start,
    stop,
  }
}
