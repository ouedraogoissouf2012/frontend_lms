/**
 * Tests de shouldForceLogout (#231) : côté LMS, un refus de rôle = 403 (jamais
 * 401), donc un 401 = session Sanctum invalide/expirée → déconnexion + redirection.
 * EXCEPTION : les 401 liés à KLASSCI (proxy, token KLASSCI manquant/expiré) ne
 * doivent PAS éjecter la session LMS.
 */
import { describe, it, expect } from 'vitest'
import { shouldForceLogout } from '@/services/errorHandler'

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
