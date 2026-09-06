/**
 * Finalités de consentement visio (#333).
 *
 * Trois clés distinctes : accepter d'être filmé pour le groupe n'est pas
 * accepter la réutilisation sur une autre session. La politique affichée
 * décrit ce qui est capté par défaut — ce n'est pas le mode d'établissement.
 */

export const VISIO_CONSENT_KEYS = Object.freeze({
  CAPTATION: 'captation',
  DIFFUSION: 'diffusion',
  REUTILISATION: 'reutilisation',
})

export const VISIO_CONSENT_FINALITES = Object.freeze([
  {
    key: VISIO_CONSENT_KEYS.CAPTATION,
    label: 'Captation',
    detail: 'Être inclus dans l\'enregistrement de cette séance.',
  },
  {
    key: VISIO_CONSENT_KEYS.DIFFUSION,
    label: 'Diffusion au groupe',
    detail: 'Autoriser la diffusion de cet enregistrement aux participants du cours.',
  },
  {
    key: VISIO_CONSENT_KEYS.REUTILISATION,
    label: 'Réutilisation',
    detail: 'Autoriser la réutilisation de cet enregistrement sur une autre session.',
  },
])

export const VISIO_CAPTURE_POLICY =
  'Par défaut, seuls la vue formateur et le partage d\'écran sont enregistrés. ' +
  'Les vignettes et les micros des apprenants ne sont pas captés.'

export function emptyConsent() {
  return {
    [VISIO_CONSENT_KEYS.CAPTATION]: false,
    [VISIO_CONSENT_KEYS.DIFFUSION]: false,
    [VISIO_CONSENT_KEYS.REUTILISATION]: false,
  }
}
