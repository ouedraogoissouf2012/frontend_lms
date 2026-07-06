import { safeUrl } from '@/utils/security/safeUrl'

export const RECORDING_STATUSES = Object.freeze({
  IDLE: 'idle',
  RECORDING: 'recording',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  READY: 'ready',
  FAILED: 'failed',
})

const VALID_STATUSES = new Set(Object.values(RECORDING_STATUSES))
const PENDING_STATUSES = new Set([
  RECORDING_STATUSES.UPLOADING,
  RECORDING_STATUSES.PROCESSING,
])

function stringOrNull(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function firstString(...values) {
  for (const value of values) {
    const normalized = stringOrNull(value)
    if (normalized) return normalized
  }
  return null
}

export function normalizeRecordingStatus(status, hasUrl = false) {
  const normalized = stringOrNull(status)?.toLowerCase()
  if (normalized && VALID_STATUSES.has(normalized)) return normalized
  return hasUrl ? RECORDING_STATUSES.READY : RECORDING_STATUSES.IDLE
}

export function normalizeVisioRecording(visio) {
  const recording = visio?.recording && typeof visio.recording === 'object'
    ? visio.recording
    : {}
  const url = firstString(
    recording.url,
    recording.recording_url,
    visio?.recording_url
  )
  const href = safeUrl(url)
  const hasUrl = href !== '#'
  const status = normalizeRecordingStatus(
    recording.status ?? visio?.recording_status,
    Boolean(url)
  )

  return {
    status,
    url,
    href,
    hasUrl,
    canOpen: status === RECORDING_STATUSES.READY && hasUrl,
    isIdle: status === RECORDING_STATUSES.IDLE,
    isRecording: status === RECORDING_STATUSES.RECORDING,
    isPending: PENDING_STATUSES.has(status),
    isReady: status === RECORDING_STATUSES.READY,
    isFailed: status === RECORDING_STATUSES.FAILED,
    errorMessage: firstString(
      recording.error_message,
      recording.failure_reason,
      visio?.recording_error
    ),
  }
}
