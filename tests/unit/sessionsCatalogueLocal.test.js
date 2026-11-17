/**
 * #605 (décision du user, 17/11 ; contrat back lms_backend#1184) : l'écran « Sessions » (/admin/training-sessions)
 * n'existe que dans une école qui gère son propre catalogue. Le serveur le dit par une CAPACITÉ, publiée à la
 * connexion : `meta.peut_gerer_catalogue_local` (CatalogueAuthority::allowsLocalCatalogue). Le front ne lit aucun
 * mode : sans la capacité (fausse, ou ABSENTE), ni le menu de bureau, ni le tiroir mobile n'offrent l'entrée, et la
 * route renvoie ailleurs. Le refus du serveur (`catalogue_managed_by_klassci`, 403) a son texte (D0).
 */
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getUser = vi.fn()
vi.mock('@/services/api', () => ({ auth: { getUser: () => getUser(), logout: vi.fn() } }))
vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/' }), useRouter: () => ({ push: vi.fn() }) }))

import { useAuthStore } from '@/stores/auth'
import { useNavigation, filterSectionsByRole } from '@/composables/useNavigation'
import { useMobileSidebar } from '@/composables/useMobileSidebar'
import { NAV_SECTIONS } from '@/constants/navigation'
import { adminRoutes } from '@/router/routes/admin.routes'
import { navigationGuard } from '@/router/guards'
import { messageForReason, normalizeError } from '@/services/errorHandler'
import { verdictCapacite } from '../../e2e/acces.mjs'
import { jeuDuParcours } from '../../e2e/klassci-ecole/jeu.mjs'

const SESSIONS = '/admin/training-sessions'
const CAPACITE = 'peutGererCatalogueLocal'
const TEXTE = 'Ce catalogue est géré par KLASSCI : il se modifie dans KLASSCI, pas ici.'

const chemins = (items) => items.map((i) => i.to ?? i.path)
const meta = (valeur) => (valeur === undefined ? {} : { peut_gerer_catalogue_local: valeur })
function connecter(role, valeur) {
  getUser.mockReturnValue({ id: 1, role })
  useAuthStore().setSession({ user: { id: 1, role }, token: 't' }, meta(valeur))
}
function mobile() {
  let api
  mount({ template: '<div />', setup() { api = useMobileSidebar({ isOpen: true }, () => {}); return {} } })
  return api
}

beforeEach(() => {
  setActivePinia(createPinia())
  sessionStorage.clear()
})

describe('#605 — la capacité est LUE du serveur, fermée par défaut', () => {
  it.each([
    [true, true],
    [false, false],
    [undefined, false],
    ['true', false],
  ])('meta.peut_gerer_catalogue_local = %s → %s', (valeur, attendu) => {
    connecter('admin', valeur)
    expect(useAuthStore()[CAPACITE]).toBe(attendu)
  })
})

describe('#605 — le menu de bureau', () => {
  it('l’entrée « Sessions » est gardée par la capacité', () => {
    expect(NAV_SECTIONS.find((i) => i.to === SESSIONS)).toMatchObject({ capacite: CAPACITE })
  })

  it.each([['admin'], ['coordinateur']])('%s : l’entrée paraît avec la capacité, jamais sans (fausse ou absente)', (role) => {
    connecter(role, true)
    expect(chemins(useNavigation().sections.value)).toContain(SESSIONS)
    connecter(role, false)
    expect(chemins(useNavigation().sections.value)).not.toContain(SESSIONS)
    connecter(role, undefined)
    expect(chemins(useNavigation().sections.value)).not.toContain(SESSIONS)
  })

  it('la capacité ne remplace pas le rôle', () => {
    expect(filterSectionsByRole(NAV_SECTIONS, 'enseignant', { [CAPACITE]: true }).some((i) => i.to === SESSIONS)).toBe(false)
  })
})

describe('#605 — le tiroir mobile (ses deux listes)', () => {
  it.each([
    ['coordinateur', 'secondaryNavItems'],
    ['admin', 'adminNavItems'],
  ])('%s (%s) : l’entrée suit la capacité', (role, liste) => {
    connecter(role, true)
    expect(chemins(mobile()[liste].value)).toContain(SESSIONS)
    connecter(role, false)
    expect(chemins(mobile()[liste].value)).not.toContain(SESSIONS)
    connecter(role, undefined)
    expect(chemins(mobile()[liste].value)).not.toContain(SESSIONS)
  })
})

describe('#605 — la route', () => {
  const route = adminRoutes.find((r) => r.path === SESSIONS)

  it('déclare la capacité qu’elle exige', () => {
    expect(route.meta).toMatchObject({ requiresAuth: true, capacite: CAPACITE })
  })

  it('avec la capacité, la garde laisse passer ; sans, elle renvoie ailleurs (aucun écran mort)', () => {
    let destination = 'non-appele'
    connecter('coordinateur', true)
    navigationGuard({ ...route, meta: route.meta }, { path: '/admin/dashboard' }, (arg) => { destination = arg })
    expect(destination).toBeUndefined()

    destination = 'non-appele'
    connecter('coordinateur', undefined)
    navigationGuard({ ...route, meta: route.meta }, { path: '/admin/dashboard' }, (arg) => { destination = arg })
    expect(destination).toBeTruthy()
    expect(destination).not.toBe(SESSIONS)
  })
})

describe('#605 — le refus du serveur (catalogue_managed_by_klassci, 403) est dit par le catalogue (D0)', () => {
  it('le motif a son texte, jamais celui du serveur', () => {
    expect(messageForReason('catalogue_managed_by_klassci')).toBe(TEXTE)
    const err = { response: { status: 403, data: { reason: 'catalogue_managed_by_klassci', message: 'Texte fictif du serveur' } } }
    expect(normalizeError(err).userMessage).toBe(TEXTE)
  })
})

describe('#605 — l’E2E de l’école KLASSCI mesure le refus (D607)', () => {
  it('le jeu KLASSCI déclare la capacité absente, comme le produit', () => {
    expect(jeuDuParcours().capacites).toMatchObject({ [CAPACITE]: false })
  })

  it('écran refusé → VERT « refus tenu » ; écran ouvert → ROUGE', () => {
    const route = { chemin: SESSIONS, capacite: CAPACITE }
    expect(verdictCapacite(route, jeuDuParcours().capacites, false, '/admin/dashboard')).toMatchObject({ verdict: 'VERT', attendu: 'refusé' })
    expect(verdictCapacite(route, jeuDuParcours().capacites, true, SESSIONS)).toMatchObject({ verdict: 'ROUGE' })
  })
})
