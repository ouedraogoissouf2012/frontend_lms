/**
 * Vue Login (#278) — la porte d'entrée, jusqu'ici SANS aucun test.
 *
 * On monte la VRAIE vue avec les VRAIS helpers `roles.js` (purs, fail-secure) :
 * seuls le service `auth` et le routeur sont mockés. C'est donc le CÂBLAGE réel
 * qui est vérifié — succès → redirection par rôle normalisé, refus #221, échec
 * serveur, exception réseau — pas un mock qui se refléterait lui-même.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Login from '@/views/Login.vue'

const { authMock } = vi.hoisted(() => ({
  authMock: { login: vi.fn(), logout: vi.fn(), getMeta: vi.fn() },
}))
vi.mock('@/services/api', () => ({ auth: authMock }))
// `@/constants/roles` n'est PAS mocké : on veut le vrai routage par rôle.

function mountLogin() {
  const push = vi.fn()
  const w = mount(Login, { global: { mocks: { $router: { push } } } })
  return { w, push }
}

async function submit(w) {
  await w.find('form').trigger('submit.prevent')
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  authMock.getMeta.mockReturnValue(null)
})

describe('Login.vue (#278)', () => {
  it('lie username/password (v-model) et les soumet au service auth', async () => {
    authMock.login.mockResolvedValue({ success: true, data: { user: { role: 'enseignant' } } })
    const { w } = mountLogin()
    await w.find('#username').setValue('prof.bede')
    await w.find('#password').setValue('secret1')
    await submit(w)
    expect(authMock.login).toHaveBeenCalledWith('prof.bede', 'secret1')
  })

  it('succès enseignant → redirige vers /teacher/dashboard (rôle réel normalisé)', async () => {
    authMock.login.mockResolvedValue({ success: true, data: { user: { role: 'enseignant' } } })
    const { w, push } = mountLogin()
    await submit(w)
    expect(push).toHaveBeenCalledWith('/teacher/dashboard')
  })

  it('succès supradmin → /admin/institutions (corrige la divergence #18)', async () => {
    authMock.login.mockResolvedValue({ success: true, data: { user: { role: 'supradmin' } } })
    const { w, push } = mountLogin()
    await submit(w)
    expect(push).toHaveBeenCalledWith('/admin/institutions')
  })

  it('#221 — compte KLASSCI sans accès LMS (parent) : logout + message explicite, AUCUNE redirection', async () => {
    authMock.login.mockResolvedValue({ success: true, data: { user: { role: 'parent' } } })
    const { w, push } = mountLogin()
    await submit(w)
    expect(authMock.logout).toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
    expect(w.find('.bg-red-100').text()).toContain("n'a pas accès au LMS")
  })

  it('réponse success:false → affiche le message serveur, pas de redirection', async () => {
    authMock.login.mockResolvedValue({ success: false, message: 'Compte désactivé' })
    const { w, push } = mountLogin()
    await submit(w)
    expect(w.find('.bg-red-100').text()).toContain('Compte désactivé')
    expect(push).not.toHaveBeenCalled()
  })

  it('exception avec message serveur → affiche ce message', async () => {
    authMock.login.mockRejectedValue({ response: { data: { message: 'Trop de tentatives' } } })
    const { w } = mountLogin()
    await submit(w)
    expect(w.find('.bg-red-100').text()).toContain('Trop de tentatives')
  })

  it('exception réseau (sans réponse) → repli « Identifiants incorrects. »', async () => {
    authMock.login.mockRejectedValue(new Error('Network Error'))
    const { w } = mountLogin()
    await submit(w)
    expect(w.find('.bg-red-100').text()).toContain('Identifiants incorrects.')
  })

  it('le bouton œil bascule le type du champ mot de passe', async () => {
    const { w } = mountLogin()
    expect(w.find('#password').attributes('type')).toBe('password')
    await w.find('button[type="button"]').trigger('click')
    expect(w.find('#password').attributes('type')).toBe('text')
  })
})
