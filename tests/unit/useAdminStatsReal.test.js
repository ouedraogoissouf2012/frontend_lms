/**
 * useAdminStats : les statistiques doivent venir de VRAIES sources.
 *
 * Défaut constaté : l'écran /admin/stats affichait ses SEIZE compteurs à zéro et
 * n'émettait AUCUNE requête. La cause est un faux repli — `user.admin_data.statistics`
 * n'existe pas dans la réponse de login, donc la branche `else`, qui code les seize
 * compteurs en dur à 0, était systématiquement prise. Ces zéros étaient de surcroît
 * écrits en cache, et le « rafraîchissement » testait la même condition impossible.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuth = vi.hoisted(() => ({ getUser: vi.fn(), getMeta: vi.fn() }))
const mockKlassci = vi.hoisted(() => ({
  getClasses: vi.fn(), getMatieres: vi.fn(), getEnseignants: vi.fn(),
}))
const mockAnalytics = vi.hoisted(() => ({ getSystemMetrics: vi.fn() }))

vi.mock('@/services/api', () => ({ auth: mockAuth }))
vi.mock('@/services/klassci', () => ({ klassciService: mockKlassci, default: mockKlassci }))
vi.mock('@/services/analytics', () => ({ analyticsService: mockAnalytics }))
vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: () => {} }))

import { useAdminStats } from '@/composables/useAdminStats'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminStats(); return () => null } })
  mount(Comp)
  await flushPromises()
  await flushPromises()
  return api
}

beforeEach(() => {
  mockAuth.getUser.mockReset().mockReturnValue({ role: 'superAdmin' }) // sans admin_data
  mockAuth.getMeta.mockReset().mockReturnValue({ institution: 'presentation' })
  mockKlassci.getClasses.mockReset().mockResolvedValue([])
  mockKlassci.getMatieres.mockReset().mockResolvedValue([])
  mockKlassci.getEnseignants.mockReset().mockResolvedValue([])
  mockAnalytics.getSystemMetrics.mockReset().mockResolvedValue(null)
})

describe('useAdminStats — vraies sources', () => {
  it('interroge réellement les services (l’écran n’émettait aucune requête)', async () => {
    await setup()
    expect(mockKlassci.getClasses).toHaveBeenCalled()
    expect(mockKlassci.getEnseignants).toHaveBeenCalled()
    expect(mockAnalytics.getSystemMetrics).toHaveBeenCalled()
  })

  it('dérive les compteurs d’établissement depuis KLASSCI', async () => {
    mockKlassci.getClasses.mockResolvedValue([
      { id: 1, places_occupees: 6, filiere: { id: 7 }, niveau: { id: 1 } },
      { id: 2, places_occupees: 5, filiere: { id: 9 }, niveau: { id: 1 } },
    ])
    mockKlassci.getMatieres.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }])
    mockKlassci.getEnseignants.mockResolvedValue([{ id: 1 }, { id: 2 }])

    const s = await setup()

    expect(s.stats.value.nb_enseignants).toBe(2)
    expect(s.stats.value.nb_etudiants).toBe(11)
    expect(s.stats.value.nb_classes_actives).toBe(2)
    expect(s.stats.value.nb_matieres_actives).toBe(3)
    expect(s.stats.value.nb_filieres).toBe(2)
    expect(s.stats.value.nb_niveaux).toBe(1)
  })

  it('renseigne les compteurs LMS depuis les métriques système', async () => {
    mockAnalytics.getSystemMetrics.mockResolvedValue({
      lessons: { total: 5 },
      evaluations: { total: 12, published: 4 },
    })

    const s = await setup()

    expect(s.stats.value.nb_lessons).toBe(5)
    expect(s.stats.value.nb_evaluations).toBe(12)
    expect(s.stats.value.nb_evaluations_actives).toBe(4)
  })

  it('marque NON MESURÉ (null) ce dont aucune source n’existe', async () => {
    const s = await setup()

    // Séances, visios, heures de cours et taux de présence n'ont aucune source
    // côté front : ils valaient 0, ce qui se lit comme une mesure.
    expect(s.stats.value.nb_seances_actives).toBe(null)
    expect(s.stats.value.nb_visios_actives).toBe(null)
    expect(s.stats.value.nb_visios_scheduled).toBe(null)
    expect(s.stats.value.nb_heures_cours).toBe(null)
    expect(s.stats.value.taux_presence).toBe(null)
  })

  it('ne fabrique pas de zéro quand les métriques système échouent', async () => {
    mockAnalytics.getSystemMetrics.mockRejectedValue(new Error('500'))
    mockKlassci.getEnseignants.mockResolvedValue([{ id: 1 }])

    const s = await setup()

    expect(s.stats.value.nb_lessons).toBe(null)
    expect(s.stats.value.nb_evaluations).toBe(null)
    expect(s.stats.value.nb_enseignants).toBe(1) // la source KLASSCI tient
  })

  it('remonte une erreur quand TOUTES les sources échouent', async () => {
    mockKlassci.getClasses.mockRejectedValue(new Error('down'))
    mockKlassci.getMatieres.mockRejectedValue(new Error('down'))
    mockKlassci.getEnseignants.mockRejectedValue(new Error('down'))
    mockAnalytics.getSystemMetrics.mockRejectedValue(new Error('down'))

    const s = await setup()

    expect(s.error.value).toBeTruthy()
    expect(s.stats.value.nb_enseignants).toBe(null)
    expect(s.loading.value).toBe(false)
  })

  it('termine le chargement', async () => {
    const s = await setup()
    expect(s.loading.value).toBe(false)
    expect(s.error.value).toBe(null)
  })

  // Reprises de l'ancien tests/unit/useAdminStats.test.js (supprimé avec le chemin
  // `admin_data.statistics` qu'il verrouillait) : ces deux comportements-là
  // restent valides et ne doivent pas disparaître avec lui.
  it('expose la méta de session (année universitaire courante)', async () => {
    mockAuth.getMeta.mockReturnValue({ annee_universitaire_courante: { nom: '2025-2026' } })
    const s = await setup()
    expect(s.meta.value.annee_universitaire_courante.nom).toBe('2025-2026')
  })

  it('refreshData recharge les statistiques depuis les services', async () => {
    mockKlassci.getEnseignants.mockResolvedValue([{ id: 1 }])
    const s = await setup()
    expect(s.stats.value.nb_enseignants).toBe(1)

    mockKlassci.getEnseignants.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }])
    s.refreshData()
    await flushPromises()
    await flushPromises()

    expect(s.stats.value.nb_enseignants).toBe(3)
  })
})
