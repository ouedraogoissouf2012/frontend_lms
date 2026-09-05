/**
 * Profil réseau de la salle visio (#327).
 *
 * ## Pourquoi ce fichier existe séparément de `visio.js`
 *
 * `visio.js` répond à « quel serveur, quelle salle, quel jeton » — l'identité de
 * la conférence. Ce fichier répond à « combien ça coûte à l'apprenant » — une
 * préoccupation distincte, qui évoluera à un autre rythme : ses valeurs seront
 * ajustées après la mesure `getStats` demandée en lms_backend#700, sans que
 * l'identité de la salle ne bouge.
 *
 * ## Le contexte chiffré
 *
 * L'UIT établit que dans les économies à faible revenu la consommation mobile
 * réelle avoisine **2 Go par mois et par abonnement**, contre plus de 13 Go en
 * moyenne mondiale. C'est l'enveloppe de l'apprenant cible, tous usages
 * confondus — pas seulement le cours.
 */

/**
 * Défauts conservateurs.
 *
 * `CHANNEL_LAST_N` est le levier n°1, et de loin : Jitsi le laisse à `-1`
 * (« unlimited »), donc l'apprenant reçoit **tous** les flux de la salle. La
 * résolution agit sur un facteur unitaire ; celui-ci sur un facteur
 * multiplicatif.
 *
 * `MAX_BITRATE_BPS` reprend **exactement** le défaut Jitsi de la couche `low`
 * (`maxBitratesVideo.low: 100000`, config.js officiel). Le rendre explicite ne
 * change donc rien au comportement : cela le rend *surchargeable*, et surtout
 * cela empêche qu'une future montée de la valeur passe inaperçue. Une première
 * rédaction posait 200000 — soit le **double** du défaut : la « valeur
 * conservatrice » aurait desserré le plafond au lieu de le resserrer.
 *
 * Ces trois valeurs sont **provisoires et assumées comme telles**. Elles se
 * surchargent par déploiement précisément pour être ajustées sans toucher au
 * code, une fois la mesure réelle disponible.
 */
export const VISIO_NETWORK_DEFAULTS = Object.freeze({
  CHANNEL_LAST_N: 2,
  VIDEO_HEIGHT: 360,
  MAX_BITRATE_BPS: 100000,
})

function readPositiveInt(name, fallback) {
  const parsed = Number.parseInt(String(import.meta.env?.[name] ?? '').trim(), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * Profil effectif, surchargeable par déploiement.
 *
 * Portée assumée : la surcharge est **par déploiement**, pas par établissement.
 * Un profil par institution suppose que le backend le renvoie ; ce champ
 * n'existe pas. Le dire plutôt que de le simuler.
 */
export function readNetworkProfile() {
  return {
    channelLastN: readPositiveInt('VITE_VISIO_CHANNEL_LAST_N', VISIO_NETWORK_DEFAULTS.CHANNEL_LAST_N),
    videoHeight: readPositiveInt('VITE_VISIO_VIDEO_HEIGHT', VISIO_NETWORK_DEFAULTS.VIDEO_HEIGHT),
    maxBitrateBps: readPositiveInt('VITE_VISIO_MAX_BITRATE_BPS', VISIO_NETWORK_DEFAULTS.MAX_BITRATE_BPS),
  }
}

/**
 * Configuration passée à `configOverwrite` de l'IFrame API — source unique.
 *
 * ## Deux clés pour le pré-join, et pourquoi
 *
 * `prejoinConfig.enabled` est la clé **documentée** du `config.js` courant de
 * Jitsi ; `prejoinPageEnabled` est l'ancienne. `buildJitsiUrl` emploie déjà la
 * première dans son fragment d'URL, `useJitsiRoom` employait la seconde : deux
 * chemins, deux clés, dont une probablement inopérante.
 *
 * On émet les deux tant que la version de Jitsi réellement déployée n'est pas
 * relevée — Jitsi ignore les clés inconnues, l'émission conjointe est donc sans
 * risque. **Dette tracée** : retirer `prejoinPageEnabled` une fois la version
 * confirmée (nombre 5 de lms_backend#700).
 */
export function jitsiConfigOverwrite(profile = readNetworkProfile()) {
  return {
    prejoinConfig: { enabled: false },
    prejoinPageEnabled: false,
    channelLastN: profile.channelLastN,
    constraints: {
      video: { height: { ideal: profile.videoHeight, max: profile.videoHeight, min: 180 } },
    },
    videoQuality: { maxBitratesVideo: { low: profile.maxBitrateBps } },
  }
}

/**
 * Modes d'entrée en salle (#328).
 *
 * ## Nommés par ce que Jitsi sait RÉELLEMENT imposer
 *
 * `channelLastN` borne le nombre de flux vidéo **reçus** ; il n'existe aucune
 * clé permettant de recevoir le partage d'écran tout en refusant les caméras
 * (vérifié contre le `config.js` officiel). Le mode intermédiaire ne peut donc
 * pas promettre « les diapositives » : il promet **un seul flux**, qui sera le
 * participant dominant — souvent l'écran partagé, pas toujours.
 *
 * Mieux vaut un nom exact qu'une promesse que la plateforme ne tient pas.
 *
 * Toutes les clés employées ici sont vérifiées présentes et top-level dans le
 * `config.js` officiel : `channelLastN`, `startWithVideoMuted`,
 * `startLowBandwidthMode`, `disableSelfView`. `startAudioOnly` **n'existe pas**
 * et n'est donc pas utilisé.
 */
export const VISIO_MODES = Object.freeze({
  AUDIO: 'audio',
  ECONOME: 'econome',
  COMPLET: 'complet',
})

/** `channelLastN` imposé par chaque mode. `null` = on garde celui du profil. */
const FLUX_PAR_MODE = Object.freeze({
  [VISIO_MODES.AUDIO]: 0,
  [VISIO_MODES.ECONOME]: 1,
  [VISIO_MODES.COMPLET]: null,
})

/**
 * Débit d'un flux vidéo reçu, dérivé des paliers publiés par Jitsi
 * (180p ≈ 200 kbit/s, 360p ≈ 500, 720p ≈ 2500).
 */
function debitParFlux(hauteur) {
  if (hauteur <= 180) return 200000
  if (hauteur <= 360) return 500000
  return 2500000
}

/**
 * Estimation du coût **vidéo reçu**, en mégaoctets par heure.
 *
 * Le premier flux arrive à la résolution demandée ; les suivants sont servis par
 * la couche basse du simulcast — c'est la raison pour laquelle un flux
 * supplémentaire ne coûte pas autant que le premier.
 *
 * ⚠️ **La part audio n'est PAS comptée** : Jitsi ne publie pas de débit audio de
 * référence, et l'inventer donnerait un chiffre faux avec l'apparence du sérieux.
 * L'interface doit donc présenter ce nombre comme la part vidéo, pas comme le
 * total. La mesure réelle est demandée en `lms_backend#700`.
 */
export function megaoctetsParHeure(mode, profile = readNetworkProfile()) {
  const flux = FLUX_PAR_MODE[mode] ?? profile.channelLastN
  if (flux <= 0) return 0

  const bps = debitParFlux(profile.videoHeight) + (flux - 1) * profile.maxBitrateBps
  return Math.round((bps * 3600) / 8 / 1024 / 1024)
}

/** Configuration Jitsi du mode choisi. */
export function jitsiConfigForMode(mode, profile = readNetworkProfile()) {
  const base = jitsiConfigOverwrite(profile)
  const flux = FLUX_PAR_MODE[mode]

  if (flux === null || flux === undefined) return base

  return {
    ...base,
    channelLastN: flux,
    startWithVideoMuted: true,
    disableSelfView: true,
    ...(mode === VISIO_MODES.AUDIO ? { startLowBandwidthMode: true } : {}),
  }
}
