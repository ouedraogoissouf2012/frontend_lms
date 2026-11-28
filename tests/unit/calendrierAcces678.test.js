/**
 * #678 (contrat serveur lms_backend#1671, PR #1845) : le calendrier de l'année d'une école.
 *
 * Contrat lu sur la PR serveur (docs/openapi.yaml, tag « Calendrier ») :
 *   - `GET /lms/calendrier?du=&au=` : tout membre de l'école, dans sa portée ; plage exigée, 400 jours au plus ;
 *   - `POST /lms/calendrier`, `PUT|DELETE /lms/calendrier/{id}` : la gestion seule (403 sinon) ;
 *   - un événement : `{ id, type, titre, debut, fin, portee: ecole|classes, classe_ids }` ;
 *   - motif 422 `classe_hors_ecole`.
 * Les DEUX volets (ARRÊT 1 de #1671) : aucune capacité ne garde l'écran. Le supradmin n'a pas d'école : pas d'entrée.
 * Ici le service par le VRAI client HTTP : seul l'adaptateur réseau est remplacé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/' }), useRouter: () => ({ push: vi.fn() }) }))

import { useAuthStore } from '@/stores/auth'
import { useNavigation } from '@/composables/useNavigation'
import { useMobileSidebar } from '@/composables/useMobileSidebar'
import { academicRoutes } from '@/router/routes/academic.routes'
import { AUTHENTICATED_ROLES } from '@/router/routes/roleGroups'
import { messageForReason } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { endpoints } from '@/services/endpoints'
import { calendrierService } from '@/services/calendrier'
import { serveurFictif } from '../helpers/serveurFictif'

const ECRAN = '/calendrier'
const chemins = (items) => items.map((i) => i.to ?? i.path)
const VACANCES = { id: 4, type: 'vacances', titre: 'Vacances de Noël', debut: '2026-12-19', fin: '2027-01-04', portee: 'ecole', classe_ids: [] }

function connecter(role) {
  useAuthStore().setSession({ user: { id: 1, role }, token: 't' }, {})
}
function tiroir() {
  let rendu
  mount({ template: '<div />', setup() { rendu = useMobileSidebar({ isOpen: true }, () => {}); return {} } })
  return rendu
}

let serveur
beforeEach(() => {
  setActivePinia(createPinia())
  sessionStorage.clear()
  serveur = serveurFictif()
})
afterEach(() => serveur.fermer())

describe('#678 — les chemins suivent la spec du serveur', () => {
  it('sous /lms/calendrier', () => {
    expect([endpoints.calendrier.liste, endpoints.calendrier.un(4)]).toEqual(['/lms/calendrier', '/lms/calendrier/4'])
  })
})

describe('#678 — le service, par le vrai client', () => {
  it('lire envoie la plage, et rend les événements', async () => {
    serveur.servir({ 'get /lms/calendrier': [200, { success: true, data: [VACANCES] }] })
    expect(await calendrierService.lire({ du: '2026-12-01', au: '2026-12-31' })).toEqual([VACANCES])
    expect(serveur.requetes[0].params).toEqual({ du: '2026-12-01', au: '2026-12-31' })
  })

  it('une liste illisible n’est pas crue', async () => {
    serveur.servir({ 'get /lms/calendrier': [200, { success: true, data: { evenements: [] } }] })
    await expect(calendrierService.lire({ du: '2026-12-01', au: '2026-12-31' })).rejects.toBeTruthy()
  })

  it('publier : la portée « toute l’école » envoie une liste vide ; un succès sans événement n’est pas cru', async () => {
    serveur.servir({ 'post /lms/calendrier': [201, { success: true, data: VACANCES }] })
    await calendrierService.publier({ type: 'vacances', titre: ' Vacances de Noël ', debut: '2026-12-19', fin: '2027-01-04', classeIds: [] })
    expect(serveur.requetes[0].corps).toEqual({ type: 'vacances', titre: 'Vacances de Noël', debut: '2026-12-19', fin: '2027-01-04', classe_ids: [] })

    serveur.servir({ 'post /lms/calendrier': [201, { success: true }] })
    await expect(calendrierService.publier({ type: 'autre', titre: 'X', debut: '2027-03-01', fin: '2027-03-01', classeIds: [] })).rejects.toBeTruthy()
  })

  it('modifier et supprimer : la méthode et le chemin de la spec', async () => {
    serveur.servir({
      'put /lms/calendrier/4': [200, { success: true, data: { ...VACANCES, portee: 'classes', classe_ids: [9] } }],
      'delete /lms/calendrier/4': [200, { success: true, message: 'Événement supprimé' }],
    })
    await calendrierService.modifier(4, { type: 'vacances', titre: 'Vacances', debut: '2026-12-19', fin: '2027-01-04', classeIds: [9] })
    await calendrierService.supprimer(4)
    expect(serveur.requetes.map((r) => [r.cle, r.corps])).toEqual([
      ['put /lms/calendrier/4', { type: 'vacances', titre: 'Vacances', debut: '2026-12-19', fin: '2027-01-04', classe_ids: [9] }],
      ['delete /lms/calendrier/4', undefined],
    ])
  })
})

describe('#678 — l’accès : tout membre de l’école, aucune capacité', () => {
  it('la route est ouverte aux comptes d’établissement, sans capacité', () => {
    const route = academicRoutes.find((r) => r.path === ECRAN)
    expect(route?.meta).toMatchObject({ requiresAuth: true, roles: AUTHENTICATED_ROLES })
    expect(route.meta.capacite).toBeUndefined()
  })

  it.each([['etudiant'], ['enseignant'], ['coordinateur'], ['admin']])('%s : le menu de bureau offre l’entrée', (role) => {
    connecter(role)
    expect(chemins(useNavigation().sections.value)).toContain(ECRAN)
  })

  it('le supradmin n’a pas d’école : pas d’entrée', () => {
    connecter('supradmin')
    expect(chemins(useNavigation().sections.value)).not.toContain(ECRAN)
    const t = tiroir()
    expect([...chemins(t.adminNavItems.value), ...chemins(t.secondaryNavItems.value)]).not.toContain(ECRAN)
  })

  it.each([
    ['etudiant', 'secondaryNavItems'],
    ['enseignant', 'secondaryNavItems'],
    ['coordinateur', 'secondaryNavItems'],
    ['admin', 'adminNavItems'],
  ])('%s : le tiroir mobile (%s) offre l’entrée, une seule fois', (role, liste) => {
    connecter(role)
    const t = tiroir()
    expect(chemins(t[liste].value)).toContain(ECRAN)
    expect([...chemins(t.adminNavItems.value), ...chemins(t.secondaryNavItems.value)].filter((c) => c === ECRAN)).toHaveLength(1)
  })
})

describe('#678 — le motif du serveur a son texte', () => {
  it('classe_hors_ecole', () => {
    expect(typeof ERROR_MESSAGES.calendrierClasseHorsEcole).toBe('string')
    expect(messageForReason('classe_hors_ecole')).toBe(ERROR_MESSAGES.calendrierClasseHorsEcole)
  })
})
