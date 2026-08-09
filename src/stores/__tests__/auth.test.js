/**
 * Tests du store d'authentification (#19) — src/stores/auth.js
 *
 * Couvre T1-T10 du design : login/logout, persistance sessionStorage, getters
 * dérivés de roles.js (fail-secure), régression #11 (token store == token login),
 * non-régression bug `user` (currentUser jamais {}), hydratation, réactivité,
 * délégation de la façade api.js.
 *
 * Isolation : Pinia neuf par test, sessionStorage (jsdom) réinitialisé, instance
 * axios `api` (default export) mockée pour contrôler les réponses HTTP sans réseau.
 */
import { setActivePinia, createPinia } from 'pinia'
import { computed } from 'vue'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// vi.hoisted : les mocks sont référencés par la factory vi.mock (hoistée en tête du module).
const { mockPost, mockGet } = vi.hoisted(() => ({ mockPost: vi.fn(), mockGet: vi.fn() }))

// On garde le module api.js réel (façade `auth` pour T10) mais on remplace
// l'instance axios `default` par un double contrôlable (pas de réseau).
vi.mock('@/services/api', async (importActual) => {
  const actual = await importActual()
  return { ...actual, default: { post: mockPost, get: mockGet } }
})
vi.mock('@/services/cache', () => ({ clearAllCache: vi.fn() }))

import { useAuthStore } from '@/stores/auth'
import { auth as authFacade } from '@/services/api'
import { clearAllCache } from '@/services/cache'

const LOGIN_RESPONSE = {
  success: true,
  data: { token: 'tok-123', user: { id: 1, name: 'Awa', role: 'superAdmin' } },
  meta: { institution: 'esi', institution_name: 'ESI Ouaga' },
}

beforeEach(() => {
  setActivePinia(createPinia())
  sessionStorage.clear()
  mockPost.mockReset()
  mockGet.mockReset()
  clearAllCache.mockClear()
})

describe('useAuthStore — login (T1, T2)', () => {
  it('T1 — login réussi peuple le store ET sessionStorage (4 clés)', async () => {
    mockPost.mockResolvedValue(LOGIN_RESPONSE)
    const store = useAuthStore()

    const res = await store.login('awa', 'secret')

    expect(mockPost).toHaveBeenCalledWith('/auth/login', { username: 'awa', password: 'secret' })
    expect(res).toEqual(LOGIN_RESPONSE)
    expect(store.token).toBe('tok-123')
    expect(store.currentUser).toEqual(LOGIN_RESPONSE.data.user)
    expect(store.userRole).toBe('superAdmin')
    expect(store.institutionSlug).toBe('esi')
    expect(store.meta).toEqual(LOGIN_RESPONSE.meta)

    expect(sessionStorage.getItem('token')).toBe('tok-123')
    expect(JSON.parse(sessionStorage.getItem('user'))).toEqual(LOGIN_RESPONSE.data.user)
    expect(JSON.parse(sessionStorage.getItem('meta'))).toEqual(LOGIN_RESPONSE.meta)
    expect(sessionStorage.getItem('institution')).toBe('esi')

    // #230 : ouvrir une session purge le cache localStorage du précédent
    // utilisateur (hygiène poste partagé).
    expect(clearAllCache).toHaveBeenCalledTimes(1)
  })

  it('T2 — login échoué (success:false) ne mute rien', async () => {
    mockPost.mockResolvedValue({ success: false, message: 'Identifiants incorrects' })
    const store = useAuthStore()

    await store.login('x', 'y')

    expect(store.isAuthenticated).toBe(false)
    expect(store.currentUser).toBeNull()
    expect(sessionStorage.getItem('token')).toBeNull()
    expect(sessionStorage.getItem('user')).toBeNull()
  })
})

describe('useAuthStore — logout (T3)', () => {
  it('T3 — logout purge state + storage + clearAllCache', async () => {
    mockPost.mockResolvedValue(LOGIN_RESPONSE)
    const store = useAuthStore()
    await store.login('awa', 'secret')

    // #230 : login purge déjà le cache (setSession). On isole ici l'assertion
    // sur le purge PROPRE au logout.
    clearAllCache.mockClear()
    store.logout()

    expect(store.isAuthenticated).toBe(false)
    expect(store.currentUser).toBeNull()
    expect(store.token).toBeNull()
    expect(store.meta).toBeNull()
    expect(sessionStorage.getItem('token')).toBeNull()
    expect(sessionStorage.getItem('user')).toBeNull()
    expect(sessionStorage.getItem('meta')).toBeNull()
    expect(sessionStorage.getItem('institution')).toBeNull()
    expect(clearAllCache).toHaveBeenCalledTimes(1)
  })
})

describe('useAuthStore — getters d\'autorisation dérivés de roles.js (T4)', () => {
  it('T4 — alias reconnus + fail-secure + isAdmin strict', () => {
    const store = useAuthStore()

    store.setSession({ token: 't', user: { role: 'superAdmin' } })
    expect(store.isSupradmin).toBe(true)
    expect(store.isAdmin).toBe(true) // admin|supradmin

    store.setSession({ token: 't', user: { role: 'teacher' } })
    expect(store.isTeacher).toBe(true)
    expect(store.isAdmin).toBe(false)

    store.setSession({ token: 't', user: { role: 'student' } })
    expect(store.isStudent).toBe(true)

    store.setSession({ token: 't', user: { role: 'coordinateur' } })
    expect(store.isAdmin).toBe(false) // coordinateur hors périmètre admin strict

    store.setSession({ token: 't', user: { role: 'hacker' } })
    expect(store.isAdmin).toBe(false)
    expect(store.isSupradmin).toBe(false)
    expect(store.isTeacher).toBe(false)
    expect(store.isStudent).toBe(false)
    expect(store.normalizedRole).toBeNull()
  })
})

describe('useAuthStore — régression #11 token cohérent (T5)', () => {
  it('T5 — le token du store (lu par l\'intercepteur) == token du login', async () => {
    mockPost.mockResolvedValue(LOGIN_RESPONSE)
    const store = useAuthStore()
    await store.login('awa', 'secret')
    // L'intercepteur lira useAuthStore().token ; il doit valoir le token reçu.
    expect(store.token).toBe(LOGIN_RESPONSE.data.token)
  })
})

describe('useAuthStore — bug `user` (T6)', () => {
  it('T6 — currentUser est l\'utilisateur après login, null sinon (jamais {})', async () => {
    const store = useAuthStore()
    expect(store.currentUser).toBeNull()

    mockPost.mockResolvedValue(LOGIN_RESPONSE)
    await store.login('awa', 'secret')
    expect(store.currentUser).toEqual(LOGIN_RESPONSE.data.user)
    expect(store.currentUser).not.toEqual({})
  })
})

describe('useAuthStore — hydratation au démarrage (T7)', () => {
  it('T7 — un store neuf s\'hydrate depuis sessionStorage', () => {
    sessionStorage.setItem('token', 'tok-xyz')
    sessionStorage.setItem('user', JSON.stringify({ id: 9, role: 'enseignant' }))
    sessionStorage.setItem('meta', JSON.stringify({ institution: 'iam', institution_name: 'IAM' }))
    sessionStorage.setItem('institution', 'iam')

    const store = useAuthStore() // doit s'hydrater à la création

    expect(store.isAuthenticated).toBe(true)
    expect(store.currentUser).toEqual({ id: 9, role: 'enseignant' })
    expect(store.institutionSlug).toBe('iam')
    expect(store.isTeacher).toBe(true)
  })

  it('T7b — JSON corrompu en storage ne casse pas le boot (state vide)', () => {
    sessionStorage.setItem('token', 'tok')
    sessionStorage.setItem('user', '{ broken json')
    const store = useAuthStore()
    // tolérant : pas d'exception ; user invalide → null
    expect(store.currentUser).toBeNull()
  })
})

describe('useAuthStore — setInstitution (T8)', () => {
  it('T8 — met à jour institutionSlug + sessionStorage', () => {
    const store = useAuthStore()
    store.setInstitution('ujkz')
    expect(store.institutionSlug).toBe('ujkz')
    expect(sessionStorage.getItem('institution')).toBe('ujkz')
  })
})

describe('useAuthStore — réactivité (T9)', () => {
  it('T9 — isAuthenticated réagit à login puis logout', async () => {
    mockPost.mockResolvedValue(LOGIN_RESPONSE)
    const store = useAuthStore()
    const authed = computed(() => store.isAuthenticated)

    expect(authed.value).toBe(false)
    await store.login('awa', 'secret')
    expect(authed.value).toBe(true)
    store.logout()
    expect(authed.value).toBe(false)
  })
})

describe('façade api.js — délégation au store (T10)', () => {
  it('T10 — auth.getUser()/getInstitution() renvoient les valeurs du store', async () => {
    mockPost.mockResolvedValue(LOGIN_RESPONSE)
    const store = useAuthStore()
    await store.login('awa', 'secret')

    expect(authFacade.getUser()).toEqual(LOGIN_RESPONSE.data.user)
    expect(authFacade.getInstitution()).toBe('esi')
    expect(authFacade.isAuthenticated()).toBe(true)
    expect(authFacade.isSupradmin()).toBe(true)
  })
})
