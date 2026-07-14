import { computed, ref } from 'vue'

const DEFAULT_RECORDING_MODE = 'file'

function isEnabled(enabled) {
  return typeof enabled === 'function'
    ? Boolean(enabled())
    : Boolean(enabled?.value ?? enabled)
}

function hasCommandApi(api) {
  return Boolean(api?.executeCommand)
}

function readMode(mode) {
  const value = typeof mode === 'function' ? mode() : mode?.value ?? mode
  return String(value || DEFAULT_RECORDING_MODE).trim() || DEFAULT_RECORDING_MODE
}

function normalizeRecordingStatus(event = {}) {
  return {
    on: Boolean(event.on),
    mode: event.mode || DEFAULT_RECORDING_MODE,
    error: event.error || null,
    transcription: Boolean(event.transcription),
    raw: event,
  }
}

function normalizeRecordingLink(event = {}) {
  return {
    link: event.link || null,
    ttl: Number.isFinite(Number(event.ttl)) ? Number(event.ttl) : null,
    raw: event,
  }
}

/**
 * Pont Jitsi IFrame API pour #204.
 *
 * Il prépare les commandes/événements recording côté iframe, mais reste
 * fail-closed : aucune commande Jitsi n'est envoyée si la capacité provider
 * n'est pas explicitement activée.
 */
export function useJitsiRecordingBridge({
  jitsiApi,
  seanceId,
  recordingProviderEnabled,
  recordingMode = DEFAULT_RECORDING_MODE,
  emit = () => {},
}) {
  const lastRecordingStatus = ref(null)
  const lastRecordingLink = ref(null)
  const recordingCommandError = ref(null)

  const canUseJitsiRecording = computed(() => (
    isEnabled(recordingProviderEnabled) && hasCommandApi(jitsiApi.value)
  ))

  function setupJitsiRecordingEvents() {
    const api = jitsiApi.value
    if (!api?.addEventListener) return

    api.addEventListener('recordingStatusChanged', (event) => {
      const payload = normalizeRecordingStatus(event)
      lastRecordingStatus.value = payload
      emit('recording-status-changed', payload)
    })

    api.addEventListener('recordingLinkAvailable', (event) => {
      const payload = normalizeRecordingLink(event)
      lastRecordingLink.value = payload
      emit('recording-link-available', payload)
    })
  }

  function startJitsiRecording(extraMetadata = {}) {
    if (!canUseJitsiRecording.value) return false

    recordingCommandError.value = null
    try {
      jitsiApi.value.executeCommand('startRecording', {
        mode: readMode(recordingMode),
        shouldShare: true,
        extraMetadata: {
          seanceId: seanceId.value,
          source: 'lms-frontend',
          ...extraMetadata,
        },
      })
      return true
    } catch (error) {
      recordingCommandError.value = error
      emit('recording-command-error', error)
      return false
    }
  }

  function stopJitsiRecording({ transcription = false } = {}) {
    if (!canUseJitsiRecording.value) return false

    recordingCommandError.value = null
    try {
      jitsiApi.value.executeCommand(
        'stopRecording',
        readMode(recordingMode),
        Boolean(transcription)
      )
      return true
    } catch (error) {
      recordingCommandError.value = error
      emit('recording-command-error', error)
      return false
    }
  }

  return {
    canUseJitsiRecording,
    lastRecordingStatus,
    lastRecordingLink,
    recordingCommandError,
    setupJitsiRecordingEvents,
    startJitsiRecording,
    stopJitsiRecording,
  }
}
