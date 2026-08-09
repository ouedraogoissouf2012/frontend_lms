/**
 * Tests de shouldForceLogout (#231) : côté LMS, un refus de rôle = 403 (jamais
 * 401), donc un 401 = session Sanctum invalide/expirée → déconnexion + redirection.
 * EXCEPTION : les 401 liés à KLASSCI (proxy, token KLASSCI manquant/expiré) ne
 * doivent PAS éjecter la session LMS.
 */
import { describe, it, expect } from 'vitest'
import { shouldForceLogout, normalizeError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const err = (status, { url = '', message = '', reason = undefined } = {}) => ({
  response: { status, data: { message, ...(reason !== undefined ? { reason } : {}) } },
  config: { url },
})

describe('errorHandler — shouldForceLogout', () => {
  it('déconnecte sur un 401 de session /auth/me', () => {
    expect(shouldForceLogout(err(401, { url: '/api/auth/me' }))).toBe(true)
  })

  it('déconnecte sur un 401 LMS générique (token Sanctum invalide/expiré)', () => {
    // #231 : le refus de rôle est un 403 (EnsureRole) ; un 401 = session invalide.
    expect(shouldForceLogout(err(401, { url: '/api/lms/seances/my-teaching' }))).toBe(true)
    expect(shouldForceLogout(err(401, { url: '/api/quizzes', message: 'Unauthenticated.' }))).toBe(true)
  })

  it('NE déconnecte PAS sur un 401 de proxy KLASSCI (par URL)', () => {
    expect(shouldForceLogout(err(401, { url: '/api/proxy/me/teacher-dashboard' }))).toBe(false)
  })

  it('NE déconnecte PAS sur un 401 avec reason klassci_session_expired', () => {
    expect(shouldForceLogout(err(401, { url: '/api/x', reason: 'klassci_session_expired' }))).toBe(false)
  })

  it('NE déconnecte PAS sur un 401 dont le message mentionne KLASSCI', () => {
    expect(shouldForceLogout(err(401, { url: '/api/x', message: 'Token KLASSCI non trouvé. Veuillez vous reconnecter.' }))).toBe(false)
  })

  it('ne déconnecte pas sur les statuts non-401', () => {
    expect(shouldForceLogout(err(500))).toBe(false)
    expect(shouldForceLogout(err(403))).toBe(false)
    expect(shouldForceLogout(err(422))).toBe(false)
  })

  it('ne lève jamais et renvoie false sur entrée invalide', () => {
    expect(shouldForceLogout(null)).toBe(false)
    expect(shouldForceLogout(undefined)).toBe(false)
    expect(shouldForceLogout({})).toBe(false)
    expect(shouldForceLogout(new Error('boom'))).toBe(false)
  })
})

describe('errorHandler — normalizeError (#240 proxy KLASSCI)', () => {
  it('401 klassci_session_expired → message KLASSCI actionnable (pas « auth » générique)', () => {
    const r = normalizeError(err(401, { url: '/api/proxy/x', reason: 'klassci_session_expired' }))
    expect(r.category).toBe('klassciExpired')
    expect(r.userMessage).toBe(ERROR_MESSAGES.klassciExpired)
  })

  it('503 → message « KLASSCI indisponible » (pas « server » générique)', () => {
    const r = normalizeError(err(503))
    expect(r.category).toBe('klassciUnavailable')
    expect(r.userMessage).toBe(ERROR_MESSAGES.klassciUnavailable)
  })

  it('non-régression : un 401 LMS sans reason reste « auth »', () => {
    const r = normalizeError(err(401, { url: '/api/auth/me' }))
    expect(r.category).toBe('auth')
  })

  it('non-régression : 500 reste « server », 422 agrège la validation', () => {
    expect(normalizeError(err(500)).category).toBe('server')
    const v = normalizeError({ response: { status: 422, data: { errors: { nom: ['Le nom est requis.'] } } } })
    expect(v.category).toBe('validation')
    expect(v.userMessage).toContain('Le nom est requis.')
  })
})
