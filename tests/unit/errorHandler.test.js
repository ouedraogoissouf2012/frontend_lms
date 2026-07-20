/**
 * Tests de shouldForceLogout (#fix connexion) : un 401 ne doit déconnecter que
 * s'il invalide explicitement la session locale via /auth/me — PAS un 401
 * d'endpoint métier/proxy, qui peut seulement refuser un rôle ou KLASSCI.
 */
import { describe, it, expect } from 'vitest'
import { shouldForceLogout } from '@/services/errorHandler'

const err = (status, { url = '', message = '' } = {}) => ({
  response: { status, data: { message } },
  config: { url },
})

describe('errorHandler — shouldForceLogout', () => {
  it('déconnecte sur un 401 de session /auth/me', () => {
    expect(shouldForceLogout(err(401, { url: '/api/auth/me' }))).toBe(true)
  })

  it('NE déconnecte PAS sur un 401 métier LMS', () => {
    expect(shouldForceLogout(err(401, { url: '/api/lms/seances/my-teaching' }))).toBe(false)
  })

  it('NE déconnecte PAS sur un 401 de proxy KLASSCI (par URL)', () => {
    expect(shouldForceLogout(err(401, { url: '/api/proxy/me/teacher-dashboard' }))).toBe(false)
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
