/**
 * Test du composable useAdminSeances (#G1 ≤300) : chargement des séances avec
 * cache, gestion d'erreur, chargement enseignants/classes, refreshData et actions.
 * Services KLASSCI + cache mockés (calqué sur useAdminUsers.test.js).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getSeances = vi.fn()
const getTeachers = vi.fn()
const getClasses = vi.fn()

vi.mock('@/services/cache', () => ({
  readCache: () => null,
  readCacheStale: () => ({ data: null }),
  writeCache: () => {},
}))
vi.mock('@/services/klassci', () => ({
  klassciService: {
    getSeances: (...a) => getSeances(...a),
    getTeachers: (...a) => getTeachers(...a),
    getClasses: (...a) => getClasses(...a),
  },
}))

import { useAdminSeances } from '@/composables/useAdminSeances'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminSeances(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

beforeEach(() => {
  vi.clearAllMocks()
  getSeances.mockResolvedValue({ success: true, data: [{ id: 1 }, { id: 2 }] })
  getTeachers.mockResolvedValue([{ id: 10, nom: 'Zoé', prenom: 'P' }])
  getClasses.mockResolvedValue([{ id: 5, name: '6e A' }])
})

describe('useAdminSeances (#G1)', () => {
  it('charge les séances, enseignants et classes au montage', async () => {
    const s = await setup()
    expect(s.seances.value).toHaveLength(2)
    expect(s.teachers.value).toHaveLength(1)
    expect(s.classes.value).toHaveLength(1)
    expect(s.loading.value).toBe(false)
    expect(s.error.value).toBe(null)
  })

  it('expose les filtres avec leurs valeurs par défaut', async () => {
    const s = await setup()
    expect(s.filters.value).toEqual({ days: '30', teacher_id: '', classe_id: '', status: '' })
  })

  it('ne charge les séances qu\'UNE fois au montage (pas de double fetch)', async () => {
    // Régression : useCachedResource charge déjà au setup (immediate) ; un load()
    // supplémentaire dans onMounted déclenchait un second appel réseau inutile.
    await setup()
    expect(getSeances).toHaveBeenCalledTimes(1)
  })

  it('renseigne error quand la réponse échoue', async () => {
    getSeances.mockResolvedValue({ success: false, message: 'Boom' })
    const s = await setup()
    expect(s.error.value).toBe('Boom')
    expect(s.loading.value).toBe(false)
  })

  it('renseigne error quand le service rejette', async () => {
    getSeances.mockRejectedValue(new Error('Réseau'))
    const s = await setup()
    expect(s.error.value).toBe('Réseau')
  })

  it('refreshData relance les trois chargements', async () => {
    const s = await setup()
    vi.clearAllMocks()
    getSeances.mockResolvedValue({ success: true, data: [] })
    getTeachers.mockResolvedValue([])
    getClasses.mockResolvedValue([])
    s.refreshData()
    await flushPromises()
    expect(getSeances).toHaveBeenCalledTimes(1)
    expect(getTeachers).toHaveBeenCalledTimes(1)
    expect(getClasses).toHaveBeenCalledTimes(1)
  })

  it('viewSeanceDetails et enableVisio sont exposées et sûres à appeler', async () => {
    const s = await setup()
    expect(() => s.viewSeanceDetails({ id: 1 })).not.toThrow()
    expect(() => s.enableVisio({ id: 1 })).not.toThrow()
  })
})
