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
  VISIO_MODES,
  readNetworkProfile,
  jitsiConfigOverwrite,
  jitsiConfigForMode,
  megaoctetsParHeure,
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

  // ── Modes d'entree en salle (#328) ──────────────────────────────────────

  /**
   * `channelLastN: 0` est la seule facon, verifiee dans le config.js officiel,
   * de ne recevoir AUCUN flux video. Si cette valeur derivait, le mode « audio
   * seul » deviendrait un mensonge affiche a l'apprenant.
   */
  it('M1 — audio seul : aucun flux video recu ni envoye', () => {
    const c = jitsiConfigForMode(VISIO_MODES.AUDIO)
    expect(c.channelLastN).toBe(0)
    expect(c.startWithVideoMuted).toBe(true)
    expect(c.startLowBandwidthMode).toBe(true)
    expect(megaoctetsParHeure(VISIO_MODES.AUDIO)).toBe(0)
  })

  it('M2 — economie : un seul flux recu, camera coupee', () => {
    const c = jitsiConfigForMode(VISIO_MODES.ECONOME)
    expect(c.channelLastN).toBe(1)
    expect(c.startWithVideoMuted).toBe(true)
    expect(c.startLowBandwidthMode).toBeUndefined()
  })

  /**
   * M3 affirmait `startWithVideoMuted` INDEFINI en mode complet. Omettre une
   * cle n\'est pas la mettre a faux : Jitsi combine son reglage avec celui
   * qu\'il a MEMORISE dans le navigateur. Preuve, dans le bundle deploye
   * (app.bundle.min.js, version 9365) :
   *
   *   disableSelfView || e["features/base/settings"].disableSelfView || ...
   *
   * Consequence mesuree en production le 2026-09-17 : un enseignant ayant
   * rejoint une fois en mode econome gardait sa video MASQUEE dans tous les
   * modes suivants. Ecran entierement noir, camera activee, aucun message.
   *
   * Le mode complet promet a l\'ecran « Votre camera est active ». Il doit donc
   * poser ces deux cles a FAUX, pas les taire.
   */
  it('M3 — complet : la camera est active et la video de soi est visible', () => {
    const c = jitsiConfigForMode(VISIO_MODES.COMPLET)
    expect(c.channelLastN).toBe(VISIO_NETWORK_DEFAULTS.CHANNEL_LAST_N)
    expect(c.startWithVideoMuted).toBe(false)
    expect(c.disableSelfView).toBe(false)
  })

  /**
   * #415 — AUCUN mode ne masque la video de soi, et chacun le dit (false, pas
   * une cle absente). Ce test remplace l'ancien M3b, qui exigeait l'inverse.
   *
   * Masquer sa propre vignette n'economise rien : elle montre le flux LOCAL, qui
   * ne passe pas par le reseau. L'economie tient a `startWithVideoMuted` (rien
   * n'est envoye) et a `channelLastN` (ce qui est recu).
   *
   * Et ce reglage n'est pas anodin : Jitsi COPIE `disableSelfView` de la config
   * dans ses reglages persistes (base/config/middleware.any.ts:76-80, au tag
   * stable/jitsi-meet_11248), puis les combine par un OU (getHideSelfView,
   * base/settings/functions.any.ts:123-125). Une seule entree en mode econome
   * laissait donc l'ecran noir dans tous les modes suivants.
   */
  it('M3b — aucun mode ne masque la video de soi (#415)', () => {
    for (const mode of Object.values(VISIO_MODES)) {
      expect(jitsiConfigForMode(mode).disableSelfView, mode).toBe(false)
    }
  })

  it('M3c — la config par defaut (salle montee sans mode) ne la masque pas non plus', () => {
    expect(jitsiConfigOverwrite().disableSelfView).toBe(false)
  })

  /**
   * L'ecran affiche ces nombres a l'apprenant. Un cout qui n'augmente pas avec
   * le nombre de flux rendrait le choix arbitraire — donc inutile.
   */
  it('M4 — le cout croit strictement avec le nombre de flux recus', () => {
    const audio = megaoctetsParHeure(VISIO_MODES.AUDIO)
    const econome = megaoctetsParHeure(VISIO_MODES.ECONOME)
    const complet = megaoctetsParHeure(VISIO_MODES.COMPLET)
    expect(audio).toBeLessThan(econome)
    expect(econome).toBeLessThan(complet)
  })

  it('M5 — le cout suit la resolution du profil', () => {
    const en360 = megaoctetsParHeure(VISIO_MODES.ECONOME, { channelLastN: 1, videoHeight: 360, maxBitrateBps: 100000 })
    const en180 = megaoctetsParHeure(VISIO_MODES.ECONOME, { channelLastN: 1, videoHeight: 180, maxBitrateBps: 100000 })
    expect(en180).toBeLessThan(en360)
  })

  /**
   * `startAudioOnly` n'existe PAS dans le config.js officiel de Jitsi (verifie).
   * L'emettre serait une correction cosmetique : Jitsi ignore les cles inconnues.
   */
  it('M6 — aucune cle inventee : startAudioOnly n est jamais emis', () => {
    for (const mode of Object.values(VISIO_MODES)) {
      expect(jitsiConfigForMode(mode).startAudioOnly).toBeUndefined()
    }
  })
})
