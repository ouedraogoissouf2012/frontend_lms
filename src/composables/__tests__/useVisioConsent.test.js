import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VISIO_CONSENT_KEYS } from '@/constants/visioConsent'
import { resetVisioConsentForTests, useVisioConsent } from '@/composables/useVisioConsent'

vi.mock('@/services/cache', () => ({
  cacheKey: (name) => `${name}_test`,
}))

describe('useVisioConsent (#333)', () => {
  beforeEach(() => {
    localStorage.clear()
    resetVisioConsentForTests()
  })

  it('un refus n\'empêche pas de suivre la séance', () => {
    const c = useVisioConsent()
    c.enregistrer({
      [VISIO_CONSENT_KEYS.CAPTATION]: false,
      [VISIO_CONSENT_KEYS.DIFFUSION]: false,
      [VISIO_CONSENT_KEYS.REUTILISATION]: false,
    })
    expect(c.peutRejoindre.value).toBe(true)
    expect(c.choix.value.captation).toBe(false)
  })

  it('les trois finalités sont indépendantes', () => {
    const c = useVisioConsent()
    c.enregistrer({
      captation: true,
      diffusion: true,
      reutilisation: false,
    })
    c.revoquer(VISIO_CONSENT_KEYS.DIFFUSION)
    expect(c.choix.value.captation).toBe(true)
    expect(c.choix.value.diffusion).toBe(false)
    expect(c.choix.value.reutilisation).toBe(false)
  })

  it('l\'enregistrement n\'est actionnable qu\'après un recueil', () => {
    const avant = useVisioConsent()
    expect(avant.enregistrementAutorise.value).toBe(false)
    avant.enregistrer({ captation: false, diffusion: false, reutilisation: false })
    expect(avant.enregistrementAutorise.value).toBe(true)
  })

  it('revoquerTout retire les trois autorisations sans bloquer le cours', () => {
    const c = useVisioConsent()
    c.enregistrer({ captation: true, diffusion: true, reutilisation: true })
    c.revoquerTout()
    expect(c.choix.value).toEqual({
      captation: false,
      diffusion: false,
      reutilisation: false,
    })
    expect(c.peutRejoindre.value).toBe(true)
  })
})
