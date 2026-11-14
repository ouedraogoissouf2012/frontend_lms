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
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { normalizeError } from '@/services/errorHandler'

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

  // D477 (renversé, déclaré) : le texte du front, jamais celui du serveur (D0).
  it('réponse success:false → le texte du front, jamais celui du serveur, pas de redirection', async () => {
    authMock.login.mockResolvedValue({ success: false, message: 'Compte désactivé' })
    const { w, push } = mountLogin()
    await submit(w)
    expect(w.find('.bg-red-100').text()).toBe(ERROR_MESSAGES.connexionEchouee)
    expect(push).not.toHaveBeenCalled()
  })

  // D477 (renversé, déclaré) : la catégorie de l'erreur, jamais le texte du serveur.
  it('exception avec message serveur → jamais ce message', async () => {
    authMock.login.mockRejectedValue({ response: { data: { message: 'Trop de tentatives' } } })
    const { w } = mountLogin()
    await submit(w)
    expect(w.find('.bg-red-100').text()).not.toContain('Trop de tentatives')
    expect(w.find('.bg-red-100').text()).toBe(ERROR_MESSAGES.unknown)
  })

  // D477 (renversé, déclaré) : un échec sans réponse n'est pas « Identifiants incorrects ».
  it('exception sans réponse → le repli du front, pas « Identifiants incorrects »', async () => {
    authMock.login.mockRejectedValue(new Error('Network Error'))
    const { w } = mountLogin()
    await submit(w)
    expect(w.find('.bg-red-100').text()).toBe(ERROR_MESSAGES.connexionEchouee)
  })

  it('le bouton œil bascule le type du champ mot de passe', async () => {
    const { w } = mountLogin()
    expect(w.find('#password').attributes('type')).toBe('password')
    await w.find('button[type="button"]').trigger('click')
    expect(w.find('#password').attributes('type')).toBe('text')
  })
})

// D477 : la connexion a sa règle propre, faute de `reason` côté back (AuthResponsePresenter) : le
// statut porte le sens. Les erreurs sont telles que l'intercepteur les rend (avec `userMessage`).
describe('Login.vue — le message d’un échec de connexion (D477)', () => {
  const erreur = (status, data = {}) => {
    const err = Object.assign(new Error(`HTTP ${status}`), { response: { status, data: { success: false, message: 'Texte serveur, jamais affiché', ...data } } })
    err.userMessage = normalizeError(err).userMessage
    return err
  }
  const echouer = async (err) => {
    authMock.login.mockRejectedValue(err)
    const { w } = mountLogin()
    await submit(w)
    return w.find('.bg-red-100').text()
  }

  it('401 : « Identifiants incorrects. », pas la catégorie « session » du catalogue', async () => {
    expect(await echouer(erreur(401))).toBe('Identifiants incorrects.')
  })

  it('409 : le compte en conflit, et quoi faire', async () => {
    expect(await echouer(erreur(409))).toBe(ERROR_MESSAGES.compteEnConflit)
  })

  it('503 : la panne, pas « Identifiants incorrects »', async () => {
    const err = erreur(503)
    expect(await echouer(err)).toBe(err.userMessage)
  })

  it('réseau coupé : la catégorie réseau', async () => {
    const err = Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK', request: {} })
    err.userMessage = normalizeError(err).userMessage
    expect(await echouer(err)).toBe(ERROR_MESSAGES.network)
  })

  it('jamais le texte du serveur', async () => {
    for (const status of [401, 409, 422, 500, 503]) {
      expect(await echouer(erreur(status))).not.toContain('Texte serveur, jamais affiché')
    }
  })
})

it('les textes du front pour la connexion (D477)', () => {
  expect(ERROR_MESSAGES.identifiantsIncorrects).toBe('Identifiants incorrects.')
  expect(ERROR_MESSAGES.connexionEchouee).toBe('Échec de la connexion.')
  // Le 409 : l'adresse e-mail du compte KLASSCI est déjà celle d'un autre compte de l'établissement
  // (KlassciEmailConflictGuard). Ce qui arrive, et quoi faire, sans détail interne.
  expect(ERROR_MESSAGES.compteEnConflit)
    .toBe("Votre adresse e-mail est déjà utilisée par un autre compte de votre établissement. Contactez l'administrateur de votre école.")
})
