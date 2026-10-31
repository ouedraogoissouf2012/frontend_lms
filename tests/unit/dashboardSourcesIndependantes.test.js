/**
 * Tableau de bord admin (ARRÊT 1 de Fille 1, §4) : un `Promise.all` liait les
 * sources ; un seul refus (par exemple les enseignants) effaçait AUSSI les compteurs
 * des sources qui avaient répondu. Chaque source compte désormais pour elle-même :
 * refusée → « — » (null) ; servie par le cache → mesurée sans être redemandée.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockKlassci = vi.hoisted(() => ({
  getClasses: vi.fn(), getMatieres: vi.fn(), getEnseignants: vi.fn(), getUpcomingSeances: vi.fn(),
}))
const mockAnalytics = vi.hoisted(() => ({
  getActivityTrends: vi.fn(), getPendingTasks: vi.fn(), getRecentUsers: vi.fn(), getSystemMetrics: vi.fn(),
}))
const cache = vi.hoisted(() => ({ lu: {} }))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/services/api', () => ({ auth: { getUser: () => ({}), getMeta: () => null } }))
vi.mock('@/services/klassci', () => ({ klassciService: mockKlassci }))
vi.mock('@/services/analytics', () => ({ analyticsService: mockAnalytics }))
vi.mock('@/services/cache', () => ({ readCache: (cle) => cache.lu[cle] ?? null, writeCache: () => {} }))

import { useAdminDashboard } from '@/composables/useAdminDashboard'

// Identifiants seuls : aucune charge KLASSCI n'est recopiée à la main (garde
// klassci-fixtures). Le test ne compte que les classes, pas leurs effectifs.
const CLASSES = [{ id: 1 }, { id: 2 }, { id: 3 }]
/** Refus tel que l'intercepteur le rend : `userMessage` déjà posé. */
const refus = () => Object.assign(new Error('Request failed with status code 401'), {
  response: { status: 401, data: { reason: 'klassci_token_missing' } },
  userMessage: "Aucun accès KLASSCI n'est enregistré pour ce compte : les données qui en proviennent ne peuvent pas être affichées.",
})

async function setup() {
  let api
  mount(defineComponent({ setup() { api = useAdminDashboard(); return () => null } }))
  await flushPromises()
  return api
}

beforeEach(() => {
  cache.lu = {}
  mockKlassci.getClasses.mockReset().mockResolvedValue(CLASSES)
  mockKlassci.getMatieres.mockReset().mockResolvedValue([{ id: 7 }, { id: 8 }])
  mockKlassci.getEnseignants.mockReset().mockResolvedValue([{ id: 4 }])
  mockKlassci.getUpcomingSeances.mockReset().mockResolvedValue([])
  mockAnalytics.getActivityTrends.mockReset().mockResolvedValue(null)
  mockAnalytics.getPendingTasks.mockReset().mockResolvedValue(null)
  mockAnalytics.getRecentUsers.mockReset().mockResolvedValue([])
  mockAnalytics.getSystemMetrics.mockReset().mockResolvedValue(null)
})

describe('Tableau de bord admin : un refus n\'efface plus les autres sources', () => {
  it('enseignants refusés : leur compteur « — », classes et matières mesurées, motif dit', async () => {
    mockKlassci.getEnseignants.mockRejectedValue(refus())
    const s = await setup()
    expect(s.stats.value.nb_enseignants).toBe(null)
    expect(s.stats.value.nb_classes_actives).toBe(3)
    expect(s.stats.value.nb_matieres_actives).toBe(2)
    expect(s.loadError.value).toBe(refus().userMessage)
  })

  it('classes servies par le cache, enseignants refusés : les classes restent comptées', async () => {
    cache.lu.admin_klassci_classes = CLASSES
    mockKlassci.getEnseignants.mockRejectedValue(refus())
    const s = await setup()
    expect(mockKlassci.getClasses).not.toHaveBeenCalled()
    expect(s.stats.value.nb_classes_actives).toBe(3)
    expect(s.stats.value.nb_enseignants).toBe(null)
  })

  it('tout répond : aucun compteur « — », aucune erreur', async () => {
    const s = await setup()
    expect(s.stats.value.nb_enseignants).toBe(1)
    expect(s.stats.value.nb_classes_actives).toBe(3)
    expect(s.loadError.value).toBe(null)
  })
})
