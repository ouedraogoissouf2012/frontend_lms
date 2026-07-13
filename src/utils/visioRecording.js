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

const STATUS_PRESENTATION = Object.freeze({
  [RECORDING_STATUSES.RECORDING]: {
    label: 'Enregistrement en cours',
    description: 'La séance est actuellement enregistrée.',
    iconClass: 'fa fa-circle',
    containerClass: 'bg-red-50 border-red-300 text-red-800',
    badgeClass: 'bg-red-100 text-red-700',
  },
  [RECORDING_STATUSES.UPLOADING]: {
    label: "Envoi de l'enregistrement",
    description: 'La vidéo est en cours de transmission.',
    iconClass: 'fa fa-upload',
    containerClass: 'bg-blue-50 border-blue-300 text-blue-800',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  [RECORDING_STATUSES.PROCESSING]: {
    label: "Traitement de l'enregistrement",
    description: 'La vidéo est en préparation avant publication.',
    iconClass: 'fa fa-cog',
    containerClass: 'bg-blue-50 border-blue-300 text-blue-800',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  [RECORDING_STATUSES.READY]: {
    label: 'Enregistrement disponible',
    description: 'La vidéo de la séance est prête.',
    iconClass: 'fa fa-play-circle',
    containerClass: 'bg-green-50 border-green-300 text-green-800',
    badgeClass: 'bg-green-100 text-green-700',
  },
  [RECORDING_STATUSES.FAILED]: {
    label: "Échec de l'enregistrement",
    description: "L'enregistrement n'a pas pu être finalisé.",
    iconClass: 'fa fa-exclamation-triangle',
    containerClass: 'bg-red-50 border-red-300 text-red-800',
    badgeClass: 'bg-red-100 text-red-700',
  },
})

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
    hasUrl
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

export function recordingStatusPresentation(recording) {
  const status = typeof recording === 'string' ? recording : recording?.status
  return STATUS_PRESENTATION[status] ?? null
}
