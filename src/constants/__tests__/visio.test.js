import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  VISIO_CONFIG,
  HEARTBEAT_INTERVAL_MS,
  RECORDING_POLL_INTERVAL_MS,
  PARTICIPATION_EXPIRATION_MS,
  VISIO_RECORDING_UNAVAILABLE_MESSAGE,
  getJitsiDomain,
  getVisioRoomId,
  requireVisioRoomId,
  buildJitsiUrl,
  jitsiExternalApiSrc,
  isVisioRecordingProviderEnabled,
} from '@/constants/visio'

afterEach(() => vi.unstubAllEnvs())

describe('constants/visio (#24)', () => {
  it('V1 — VISIO_CONFIG gelé', () => {
    expect(Object.isFrozen(VISIO_CONFIG)).toBe(true)
  })

  it('V2 — getJitsiDomain lit VITE_JITSI_DOMAIN', () => {
    vi.stubEnv('VITE_JITSI_DOMAIN', 'meet.mondomaine.ci')
    expect(getJitsiDomain()).toBe('meet.mondomaine.ci')
  })

  it('V3 — défaut meet.jit.si si absent/vide', () => {
    vi.stubEnv('VITE_JITSI_DOMAIN', '')
    expect(getJitsiDomain()).toBe('meet.jit.si')
  })

  it('V4 — buildJitsiUrl bare', () => {
    vi.stubEnv('VITE_JITSI_DOMAIN', '')
    expect(buildJitsiUrl('seance_42')).toBe('https://meet.jit.si/seance_42')
  })

  it('V5 — buildJitsiUrl avec displayName + prejoinDisabled (hash exact)', () => {
    vi.stubEnv('VITE_JITSI_DOMAIN', '')
    expect(buildJitsiUrl('room1', { displayName: 'Awa Koné', prejoinDisabled: true })).toBe(
      'https://meet.jit.si/room1#config.prejoinConfig.enabled=false&userInfo.displayName=Awa%20Kon%C3%A9',
    )
  })

  it('V6 — domaine custom + schéma https', () => {
    vi.stubEnv('VITE_JITSI_DOMAIN', 'visio.kalga.ci')
    expect(buildJitsiUrl('r')).toBe('https://visio.kalga.ci/r')
  })

  it('V7 — jitsiExternalApiSrc', () => {
    vi.stubEnv('VITE_JITSI_DOMAIN', '')
    expect(jitsiExternalApiSrc()).toBe('https://meet.jit.si/external_api.js')
  })

  it('V8 — constantes de temps', () => {
    expect(HEARTBEAT_INTERVAL_MS).toBe(30000)
    expect(RECORDING_POLL_INTERVAL_MS).toBe(5000)
    expect(PARTICIPATION_EXPIRATION_MS).toBe(604800000)
    expect(VISIO_CONFIG.HEARTBEAT_INTERVAL_MS).toBe(30000)
    expect(VISIO_CONFIG.RECORDING_POLL_INTERVAL_MS).toBe(5000)
  })

  it('V8.1 — recording provider désactivé par défaut', () => {
    expect(VISIO_CONFIG.RECORDING_PROVIDER_ENABLED).toBe(false)
    expect(VISIO_RECORDING_UNAVAILABLE_MESSAGE).toContain("L'enregistrement n'est pas activé")
    expect(isVisioRecordingProviderEnabled()).toBe(false)
  })

  it('V8.2 — VITE_VISIO_RECORDING_ENABLED active explicitement la capability', () => {
    vi.stubEnv('VITE_VISIO_RECORDING_ENABLED', 'true')
    expect(isVisioRecordingProviderEnabled()).toBe(true)
  })

  it('V8.3 — un signal backend false garde la priorité', () => {
    vi.stubEnv('VITE_VISIO_RECORDING_ENABLED', 'true')
    expect(isVisioRecordingProviderEnabled({ recording_provider_enabled: false })).toBe(false)
    expect(isVisioRecordingProviderEnabled({ capabilities: { recording: 'disabled' } })).toBe(false)
  })

  it('V9 — extrait uniquement une room fournie par API', () => {
    expect(getVisioRoomId({ visio_room_id: 'room-api' })).toBe('room-api')
    expect(getVisioRoomId({ visio: { room_id: 'room-nested' } })).toBe('room-nested')
    expect(getVisioRoomId({ id: 42 })).toBe(null)
  })

  it('V10 — refuse une URL sans room explicite', () => {
    expect(() => requireVisioRoomId({ id: 42 })).toThrow('Identifiant de salle visio')
    expect(() => buildJitsiUrl('')).toThrow('Identifiant de salle visio')
  })
})
