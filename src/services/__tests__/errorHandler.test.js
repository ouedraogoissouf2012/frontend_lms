/**
 * Tests de normalizeError (#20) — src/services/errorHandler.js
 *
 * Vérifie la classification par catégorie, la NON-fuite de détail technique
 * (équivalence backend §1.2 : aucun message 5xx/réseau brut affiché), la
 * structuration des erreurs de validation 422, le fail-secure sur entrée
 * invalide, le déterminisme et la pureté (pas de mutation de l'entrée).
 */
import { describe, it, expect } from 'vitest'
import { normalizeError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

/** Fabrique une erreur axios avec réponse HTTP. */
function httpError(status, data = {}) {
  return { isAxiosError: true, response: { status, data }, config: { url: '/x' } }
}

describe('normalizeError — classification par code HTTP', () => {
  it.each([
    [401, 'auth'],
    [403, 'forbidden'],
    [404, 'notFound'],
    [422, 'validation'],
    [429, 'rateLimit'],
    [500, 'server'],
    [503, 'server'],
  ])('status %i → catégorie %s + message catalogue', (status, category) => {
    const r = normalizeError(httpError(status))
    expect(r.category).toBe(category)
    expect(r.userMessage).toBe(ERROR_MESSAGES[category])
    expect(typeof r.userMessage).toBe('string')
    expect(r.userMessage.length).toBeGreaterThan(0)
  })
})

describe('normalizeError — non-fuite de détail technique (§1.2)', () => {
  it('5xx avec message SQL brut → message serveur catalogue, jamais le détail', () => {
    const r = normalizeError(httpError(500, { message: 'SQLSTATE[23000] FK constraint violated on table users' }))
    expect(r.category).toBe('server')
    expect(r.userMessage).toBe(ERROR_MESSAGES.server)
    expect(r.userMessage).not.toContain('SQLSTATE')
    expect(r.userMessage).not.toContain('constraint')
  })

  it('erreur réseau (pas de response) → message réseau, jamais ECONNREFUSED', () => {
    const r = normalizeError({ isAxiosError: true, request: {}, code: 'ECONNREFUSED', message: 'connect ECONNREFUSED 127.0.0.1:8000' })
    expect(r.category).toBe('network')
    expect(r.userMessage).toBe(ERROR_MESSAGES.network)
    expect(r.userMessage).not.toContain('ECONNREFUSED')
  })
})

describe('normalizeError — validation 422 structurée', () => {
  it('422 avec errors par champ → fieldErrors structuré + message agrégé', () => {
    const errors = { email: ['L\'email est requis'], nom: ['Le nom est trop court'] }
    const r = normalizeError(httpError(422, { errors }))
    expect(r.category).toBe('validation')
    expect(r.fieldErrors).toEqual(errors)
    expect(typeof r.userMessage).toBe('string')
    expect(r.userMessage.length).toBeGreaterThan(0)
  })

  it('422 sans détail exploitable → fieldErrors null + message validation catalogue', () => {
    expect(normalizeError(httpError(422, {})).fieldErrors).toBeNull()
    expect(normalizeError(httpError(422, {})).userMessage).toBe(ERROR_MESSAGES.validation)
    expect(normalizeError(httpError(422, { errors: {} })).fieldErrors).toBeNull()
  })
})

describe('normalizeError — fail-secure sur entrée invalide', () => {
  it.each([null, undefined, 'oops', 42, {}, new Error('boom')])(
    'entrée %s → catégorie unknown, message générique, aucune exception',
    (input) => {
      let r
      expect(() => { r = normalizeError(input) }).not.toThrow()
      expect(r.category).toBe('unknown')
      expect(r.userMessage).toBe(ERROR_MESSAGES.unknown)
      expect(r.fieldErrors).toBeNull()
    },
  )

  it('réponse applicative {success:false, message} 5xx-like → unknown sans exposer message', () => {
    const r = normalizeError({ success: false, message: 'Internal detail leak' })
    expect(r.category).toBe('unknown')
    expect(r.userMessage).not.toContain('Internal detail leak')
  })
})

describe('normalizeError — déterminisme et pureté', () => {
  it('deux appels sur la même entrée → résultats égaux', () => {
    const e = httpError(404)
    expect(normalizeError(e)).toEqual(normalizeError(e))
  })

  it('ne mute pas l\'entrée', () => {
    const e = httpError(422, { errors: { x: ['y'] } })
    const snapshot = JSON.parse(JSON.stringify(e))
    normalizeError(e)
    expect(e).toEqual(snapshot)
  })
})

/**
 * Dépassement de délai — catégorie propre.
 *
 * Sans timeout configuré, axios attend INDÉFINIMENT : un backend lent laissait
 * l'écran sur son spinner pour toujours, sans issue ni message. Une fois le
 * timeout en place, l'erreur doit être distinguée d'une panne réseau : l'action
 * utilisateur n'est pas la même (« réessayer » vs « vérifiez votre connexion »).
 */
describe('normalizeError — dépassement de délai', () => {
  it('classe ECONNABORTED en « timeout » et non en « network »', () => {
    const err = {
      isAxiosError: true,
      code: 'ECONNABORTED',
      message: 'timeout of 30000ms exceeded',
      config: { url: '/admin/matieres' },
    }
    const r = normalizeError(err)
    expect(r.category).toBe('timeout')
    expect(r.userMessage).toBe(ERROR_MESSAGES.timeout)
  })

  it('classe ETIMEDOUT en « timeout »', () => {
    const r = normalizeError({ isAxiosError: true, code: 'ETIMEDOUT', config: { url: '/x' } })
    expect(r.category).toBe('timeout')
  })

  it('ne fuit aucun détail technique dans le message (pas de « 30000ms »)', () => {
    const r = normalizeError({
      isAxiosError: true,
      code: 'ECONNABORTED',
      message: 'timeout of 30000ms exceeded',
    })
    expect(r.userMessage).not.toMatch(/\d+\s*ms|ECONNABORTED|axios/i)
  })

  it('laisse les autres erreurs réseau en « network »', () => {
    const r = normalizeError({ isAxiosError: true, code: 'ERR_NETWORK', config: { url: '/x' } })
    expect(r.category).toBe('network')
  })

  it('un timeout ne déclenche JAMAIS de déconnexion', async () => {
    const { shouldForceLogout } = await import('@/services/errorHandler')
    expect(shouldForceLogout({ isAxiosError: true, code: 'ECONNABORTED' })).toBe(false)
  })
})
