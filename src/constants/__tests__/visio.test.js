import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  VISIO_CONFIG,
  HEARTBEAT_INTERVAL_MS,
  RECORDING_POLL_INTERVAL_MS,
  PARTICIPATION_EXPIRATION_MS,
  VISIO_RECORDING_UNAVAILABLE_MESSAGE,
  VISIO_ROOM_REQUIRED_MESSAGE,
  VISIO_TOKEN_REQUIRED_MESSAGE,
  getJitsiDomain,
  getVisioRoomId,
  requireVisioRoomId,
  buildJitsiUrl,
  buildJoinUrlFromResponse,
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

  // ─────────────────────────────────────────────────────────────────────────
  // Jeton d'accès (#469) — le serveur tourne avec ENABLE_AUTH=1 et
  // ENABLE_GUESTS=0 : sans `?jwt=`, aucune salle ne s'ouvre. Le backend émet le
  // jeton depuis #668 ; le front ne le posait nulle part.
  // ─────────────────────────────────────────────────────────────────────────

  it('V11 — le jeton est posé en query, AVANT le fragment', () => {
    vi.stubEnv('VITE_JITSI_DOMAIN', 'visio.klassci.com')
    expect(buildJitsiUrl('lms_abc', { token: 'eyJhbG.payload.sig' })).toBe(
      'https://visio.klassci.com/lms_abc?jwt=eyJhbG.payload.sig',
    )
  })

  it('V12 — jeton ET fragment coexistent dans le bon ordre', () => {
    vi.stubEnv('VITE_JITSI_DOMAIN', 'visio.klassci.com')
    expect(
      buildJitsiUrl('lms_abc', { token: 'jeton', displayName: 'Awa Koné', prejoinDisabled: true }),
    ).toBe(
      'https://visio.klassci.com/lms_abc?jwt=jeton#config.prejoinConfig.enabled=false&userInfo.displayName=Awa%20Kon%C3%A9',
    )
  })

  /**
   * Un jeton absent ne doit RIEN changer à l'URL : c'est ce qui garantit que
   * les parcours sans authentification (V4/V5) restent identiques, et que la
   * bascule est additive.
   */
  it('V13 — sans jeton, l\'URL est strictement inchangée', () => {
    vi.stubEnv('VITE_JITSI_DOMAIN', 'visio.klassci.com')
    const sansOption = buildJitsiUrl('r')
    expect(buildJitsiUrl('r', { token: null })).toBe(sansOption)
    expect(buildJitsiUrl('r', { token: '' })).toBe(sansOption)
    expect(buildJitsiUrl('r', { token: '   ' })).toBe(sansOption)
  })

  it('V14 — un jeton hostile ne peut pas injecter de paramètre', () => {
    vi.stubEnv('VITE_JITSI_DOMAIN', 'visio.klassci.com')
    expect(buildJitsiUrl('r', { token: 'a&config.startWithAudioMuted=true' })).toBe(
      'https://visio.klassci.com/r?jwt=a%26config.startWithAudioMuted%3Dtrue',
    )
  })

  // ── buildJoinUrlFromResponse : salle ET jeton dans la MÊME réponse ────────

  const reponseJoin = (data) => ({ success: true, message: 'ok', data })

  it('V15 — salle et jeton sont lus dans la réponse de join', () => {
    vi.stubEnv('VITE_JITSI_DOMAIN', 'visio.klassci.com')
    expect(
      buildJoinUrlFromResponse(
        reponseJoin({ visio_room_id: 'lms_abc', visio_token: 'jeton', visio_token_available: true }),
        { displayName: 'Awa', prejoinDisabled: true },
      ),
    ).toBe(
      'https://visio.klassci.com/lms_abc?jwt=jeton#config.prejoinConfig.enabled=false&userInfo.displayName=Awa',
    )
  })

  /**
   * Le cœur du correctif : un jeton indisponible doit ÉCHOUER, jamais ouvrir
   * une salle qui refusera l'entrée. Un échec silencieux rendrait la correction
   * invisible — c'est l'état d'avant, repeint en « corrigé ».
   */
  it('V16 — jeton indisponible : échec explicite, pas d\'URL dégradée', () => {
    vi.stubEnv('VITE_JITSI_DOMAIN', 'visio.klassci.com')
    expect(() =>
      buildJoinUrlFromResponse(
        reponseJoin({ visio_room_id: 'lms_abc', visio_token: null, visio_token_available: false }),
      ),
    ).toThrow(VISIO_TOKEN_REQUIRED_MESSAGE)
  })

  it('V17 — drapeau vrai mais jeton vide : incohérence serveur, refusée aussi', () => {
    vi.stubEnv('VITE_JITSI_DOMAIN', 'visio.klassci.com')
    expect(() =>
      buildJoinUrlFromResponse(
        reponseJoin({ visio_room_id: 'lms_abc', visio_token: '  ', visio_token_available: true }),
      ),
    ).toThrow(VISIO_TOKEN_REQUIRED_MESSAGE)
  })

  it('V18 — salle absente de la réponse : message de salle, pas de jeton', () => {
    vi.stubEnv('VITE_JITSI_DOMAIN', 'visio.klassci.com')
    expect(() =>
      buildJoinUrlFromResponse(reponseJoin({ visio_token: 'jeton', visio_token_available: true })),
    ).toThrow(VISIO_ROOM_REQUIRED_MESSAGE)
  })
})
