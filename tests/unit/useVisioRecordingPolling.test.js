/**
 * Tests du polling d'enregistrement visio (#198).
 * Le service reste la source de vérité ; le composable orchestre seulement
 * refresh manuel, polling intervalle et arrêt sur états terminaux/erreur.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const { getVisioRecording } = vi.hoisted(() => ({
  getVisioRecording: vi.fn(),
}))

vi.mock('@/services/lms', () => ({
  default: { getVisioRecording },
  lmsService: { getVisioRecording },
}))

import {
  resolveVisioRecordingPayload,
  shouldPollVisioRecording,
  useVisioRecordingPolling,
} from '@/composables/useVisioRecordingPolling'

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

describe('useVisioRecordingPolling (#198)', () => {
  beforeEach(() => {
    getVisioRecording.mockReset()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('résout les enveloppes backend attendues', () => {
    const recording = { status: 'recording' }
    expect(resolveVisioRecordingPayload({ data: { recording } })).toBe(recording)
    expect(resolveVisioRecordingPayload({ recording })).toBe(recording)
    expect(resolveVisioRecordingPayload({ data: { visio: { recording } } })).toBe(recording)
  })

  it('poll uniquement les états non terminaux', () => {
    expect(shouldPollVisioRecording({ status: 'recording' })).toBe(true)
    expect(shouldPollVisioRecording({ status: 'uploading' })).toBe(true)
    expect(shouldPollVisioRecording({ status: 'processing' })).toBe(true)
    expect(shouldPollVisioRecording({ status: 'ready' })).toBe(false)
    expect(shouldPollVisioRecording({ status: 'failed' })).toBe(false)
    expect(shouldPollVisioRecording({ status: 'idle' })).toBe(false)
  })

  it('refreshRecording appelle le service et normalise le statut', async () => {
    getVisioRecording.mockResolvedValue({
      data: { recording: { status: 'processing' } },
    })

    const polling = useVisioRecordingPolling({ getSeanceId: () => 42 })
    const result = await polling.refreshRecording()

    expect(getVisioRecording).toHaveBeenCalledWith(42)
    expect(result.status).toBe('processing')
    expect(polling.recording.value.isPending).toBe(true)
  })

  it('start lance le polling puis stoppe quand le statut devient terminal', async () => {
    getVisioRecording
      .mockResolvedValueOnce({ data: { recording: { status: 'recording' } } })
      .mockResolvedValueOnce({ data: { recording: { status: 'ready', url: 'https://cdn.test/r.mp4' } } })

    const polling = useVisioRecordingPolling({ getSeanceId: () => 7, intervalMs: 1000 })
    polling.start()

    await flushPromises()
    await vi.advanceTimersByTimeAsync(1000)

    expect(getVisioRecording).toHaveBeenCalledTimes(2)
    expect(polling.recording.value.status).toBe('ready')
    expect(polling.polling.value).toBe(false)
  })

  it("n'appelle pas l'API sans séance ou si le polling est désactivé", async () => {
    const noSeance = useVisioRecordingPolling({ getSeanceId: () => null })
    await noSeance.refreshRecording()

    const disabled = useVisioRecordingPolling({
      getSeanceId: () => 9,
      isEnabled: () => false,
    })
    disabled.start()
    await flushPromises()

    expect(getVisioRecording).not.toHaveBeenCalled()
    expect(disabled.polling.value).toBe(false)
  })

  it('stoppe le polling et expose l’erreur si l’API échoue', async () => {
    const onError = vi.fn()
    const error = new Error('backend down')
    getVisioRecording.mockRejectedValue(error)

    const polling = useVisioRecordingPolling({
      getSeanceId: () => 11,
      onError,
    })

    polling.start()
    await flushPromises()

    expect(onError).toHaveBeenCalledWith(error)
    expect(polling.error.value).toBe(error)
    expect(polling.polling.value).toBe(false)
  })
})
