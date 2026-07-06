import { describe, it, expect } from 'vitest'
import {
  normalizeRecordingStatus,
  normalizeVisioRecording,
  RECORDING_STATUSES,
} from '@/utils/visioRecording'

describe('utils/visioRecording — normalizeRecordingStatus', () => {
  it('normalise les statuts connus', () => {
    expect(normalizeRecordingStatus('recording')).toBe(RECORDING_STATUSES.RECORDING)
    expect(normalizeRecordingStatus(' PROCESSING ')).toBe(RECORDING_STATUSES.PROCESSING)
  })

  it('fallback ready si une URL legacy existe, sinon idle', () => {
    expect(normalizeRecordingStatus(null, true)).toBe(RECORDING_STATUSES.READY)
    expect(normalizeRecordingStatus('inconnu', true)).toBe(RECORDING_STATUSES.READY)
    expect(normalizeRecordingStatus(null, false)).toBe(RECORDING_STATUSES.IDLE)
  })
})

describe('utils/visioRecording — normalizeVisioRecording', () => {
  it('retourne idle sans recording', () => {
    const recording = normalizeVisioRecording(null)

    expect(recording.status).toBe(RECORDING_STATUSES.IDLE)
    expect(recording.canOpen).toBe(false)
    expect(recording.hasUrl).toBe(false)
  })

  it('mappe recording_url legacy vers ready ouvrable', () => {
    const recording = normalizeVisioRecording({
      recording_url: 'https://cdn.example.test/seance.mp4',
    })

    expect(recording.status).toBe(RECORDING_STATUSES.READY)
    expect(recording.url).toBe('https://cdn.example.test/seance.mp4')
    expect(recording.href).toBe('https://cdn.example.test/seance.mp4')
    expect(recording.canOpen).toBe(true)
  })

  it('lit le futur objet recording sans dépendre de recording_url', () => {
    const recording = normalizeVisioRecording({
      recording: {
        status: 'processing',
        url: 'https://cdn.example.test/seance.mp4',
      },
    })

    expect(recording.status).toBe(RECORDING_STATUSES.PROCESSING)
    expect(recording.isPending).toBe(true)
    expect(recording.canOpen).toBe(false)
  })

  it('neutralise une URL dangereuse sans masquer le statut backend', () => {
    const recording = normalizeVisioRecording({
      recording: {
        status: 'ready',
        url: 'javascript:alert(1)',
      },
    })

    expect(recording.status).toBe(RECORDING_STATUSES.READY)
    expect(recording.href).toBe('#')
    expect(recording.hasUrl).toBe(false)
    expect(recording.canOpen).toBe(false)
  })
})
