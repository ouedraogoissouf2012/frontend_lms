/**
 * Tests du profil reseau — src/composables/useNetworkProfile.js (#328)
 *
 * Ce que ce fichier protege : le point de decision UNIQUE du cout reseau.
 * Si chaque composant lisait `navigator.connection` de son cote, on obtiendrait
 * des decisions divergentes sur la meme page.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('@/services/cache', () => ({ cacheKey: (n) => `${n}_cache_inst_u1` }))

import { useNetworkProfile, modeSuggere } from '@/composables/useNetworkProfile'
import { VISIO_MODES } from '@/constants/visioNetwork'

function poserConnexion(valeur) {
  Object.defineProperty(navigator, 'connection', { value: valeur, configurable: true })
}

beforeEach(() => localStorage.clear())
afterEach(() => { poserConnexion(undefined); vi.unstubAllGlobals() })

describe('useNetworkProfile (#328)', () => {
  it('P1 — saveData prime sur tout : l utilisateur a deja exprime son choix', () => {
    expect(modeSuggere({ saveData: true, effectiveType: '4g' })).toBe(VISIO_MODES.AUDIO)
  })

  it('P2 — 2g et slow-2g suggerent l audio seul', () => {
    expect(modeSuggere({ saveData: false, effectiveType: '2g' })).toBe(VISIO_MODES.AUDIO)
    expect(modeSuggere({ saveData: false, effectiveType: 'slow-2g' })).toBe(VISIO_MODES.AUDIO)
  })

  it('P3 — API absente : on ne force rien, on reste econome', () => {
    expect(modeSuggere({ saveData: false, effectiveType: null })).toBe(VISIO_MODES.ECONOME)
  })

  it('P4 — le choix est memorise', () => {
    poserConnexion({ effectiveType: '4g', saveData: false })
    const a = useNetworkProfile()
    a.choisir(VISIO_MODES.AUDIO)
    expect(useNetworkProfile().choisi.value).toBe(VISIO_MODES.AUDIO)
  })

  it('P5 — un mode inconnu est refuse, jamais enregistre', () => {
    poserConnexion({ effectiveType: '4g', saveData: false })
    const p = useNetworkProfile()
    const avant = p.choisi.value
    p.choisir('videoconference-8k')
    expect(p.choisi.value).toBe(avant)
  })

  /**
   * Un stockage corrompu ou indisponible (navigation privee, quota) ne doit
   * JAMAIS empecher un apprenant de suivre son cours.
   */
  it('P6 — une preference illisible retombe sur la suggestion', () => {
    poserConnexion({ effectiveType: '2g', saveData: false })
    localStorage.setItem('visio_mode_reseau_cache_inst_u1', 'valeur-corrompue')
    expect(useNetworkProfile().choisi.value).toBe(VISIO_MODES.AUDIO)
  })

  it('P7 — un localStorage qui leve ne fait pas echouer le composable', () => {
    poserConnexion({ effectiveType: '4g', saveData: false })
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('quota') },
      setItem: () => { throw new Error('quota') },
    })
    const p = useNetworkProfile()
    expect(() => p.choisir(VISIO_MODES.AUDIO)).not.toThrow()
    expect(p.choisi.value).toBe(VISIO_MODES.AUDIO)
  })
})
