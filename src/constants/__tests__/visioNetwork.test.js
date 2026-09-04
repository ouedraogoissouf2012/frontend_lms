/**
 * Tests du profil réseau visio — src/constants/visioNetwork.js (#327)
 *
 * ## Ce que ce fichier protège
 *
 * Le coût de la séance pour l'apprenant. `channelLastN` vaut `-1`
 * (« unlimited ») par défaut chez Jitsi : sans surcharge, l'apprenant reçoit
 * TOUS les flux de la salle. Sur une cible dont l'enveloppe mobile médiane est
 * de 2 Go par mois tous usages confondus (UIT), ce n'est pas un réglage de
 * confort.
 *
 * Les valeurs elles-mêmes sont provisoires — la mesure `getStats` réelle est
 * demandée en lms_backend#700. Ce qui est verrouillé ici, c'est qu'elles soient
 * BORNÉES et SURCHARGEABLES, pas leur valeur exacte.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  VISIO_NETWORK_DEFAULTS,
  readNetworkProfile,
  jitsiConfigOverwrite,
} from '@/constants/visioNetwork'

afterEach(() => vi.unstubAllEnvs())

describe('constants/visioNetwork (#327)', () => {
  it('N1 — les défauts sont gelés et conservateurs', () => {
    expect(Object.isFrozen(VISIO_NETWORK_DEFAULTS)).toBe(true)
    expect(readNetworkProfile()).toEqual({
      channelLastN: 2,
      videoHeight: 360,
      maxBitrateBps: 100000,
    })
  })

  it('N2 — le profil se surcharge par déploiement', () => {
    vi.stubEnv('VITE_VISIO_CHANNEL_LAST_N', '1')
    vi.stubEnv('VITE_VISIO_VIDEO_HEIGHT', '180')
    vi.stubEnv('VITE_VISIO_MAX_BITRATE_BPS', '100000')

    expect(readNetworkProfile()).toEqual({
      channelLastN: 1,
      videoHeight: 180,
      maxBitrateBps: 100000,
    })
  })

  /**
   * Une surcharge invalide doit retomber sur le défaut, jamais produire `NaN` :
   * un `NaN` transmis à Jitsi ne lèverait pas — il annulerait silencieusement la
   * borne, ce qui est exactement le défaut qu'on corrige.
   */
  it('N3 — une surcharge invalide retombe sur le défaut, jamais sur NaN', () => {
    vi.stubEnv('VITE_VISIO_CHANNEL_LAST_N', 'beaucoup')
    vi.stubEnv('VITE_VISIO_VIDEO_HEIGHT', '-5')
    vi.stubEnv('VITE_VISIO_MAX_BITRATE_BPS', '0')

    const profile = readNetworkProfile()
    expect(profile.channelLastN).toBe(2)
    expect(profile.videoHeight).toBe(360)
    expect(profile.maxBitrateBps).toBe(100000)
    expect(Number.isNaN(profile.channelLastN)).toBe(false)
  })

  /**
   * `-1` est la valeur DANGEREUSE : c'est le défaut Jitsi, « unlimited ». Une
   * surcharge de déploiement ne doit jamais pouvoir la restaurer par accident —
   * `readPositiveInt` n'accepte que les entiers strictement positifs.
   */
  it('N3.1 — channelLastN = -1 (« unlimited ») est refusé', () => {
    vi.stubEnv('VITE_VISIO_CHANNEL_LAST_N', '-1')
    expect(readNetworkProfile().channelLastN).toBe(2)
    expect(jitsiConfigOverwrite().channelLastN).not.toBe(-1)
  })

  /**
   * Le défaut Jitsi de la couche basse est 100000. Poser une valeur SUPÉRIEURE
   * desserrerait le plafond en croyant le resserrer — une première rédaction de
   * ce module posait 200000.
   */
  it('N3.2 — le plafond de la couche basse ne dépasse pas le défaut Jitsi', () => {
    expect(VISIO_NETWORK_DEFAULTS.MAX_BITRATE_BPS).toBeLessThanOrEqual(100000)
  })

  it('N4 — la config transmise à Jitsi borne le nombre de flux reçus', () => {
    const config = jitsiConfigOverwrite({
      channelLastN: 2,
      videoHeight: 360,
      maxBitrateBps: 100000,
    })

    expect(config.channelLastN).toBe(2)
    expect(config.channelLastN).not.toBe(-1)
    expect(config.constraints.video.height.max).toBe(360)
    expect(config.videoQuality.maxBitratesVideo.low).toBe(100000)
  })

  it('N5 — sans argument, la config applique le profil lu de l’environnement', () => {
    vi.stubEnv('VITE_VISIO_CHANNEL_LAST_N', '3')
    expect(jitsiConfigOverwrite().channelLastN).toBe(3)
  })

  /**
   * `prejoinConfig.enabled` est la clé documentée, `prejoinPageEnabled`
   * l'ancienne. On émet les deux tant que la version de Jitsi déployée n'est pas
   * relevée. Ce test existe pour que le retrait de la seconde soit un geste
   * DÉLIBÉRÉ, pas un oubli.
   */
  it('N6 — les deux clés de pré-join sont émises (dette tracée)', () => {
    const config = jitsiConfigOverwrite()
    expect(config.prejoinConfig.enabled).toBe(false)
    expect(config.prejoinPageEnabled).toBe(false)
  })
})
