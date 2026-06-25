/**
 * Test du composable useTeacherLessons (#H4 ≤300) : chargement (API), filtres, stats,
 * navigation. vue-router, klassci/lesson services et cache mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const push = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))

let cacheStore = {}
vi.mock('@/services/cache', () => ({
  readCache: (k) => (k in cacheStore ? cacheStore[k] : null),
  writeCache: (k, v) => { cacheStore[k] = v }
}))

const lessonsPayload = [
  { id: 1, title: 'A', status: 'published', type: 'video', matiere_id: 7 },
  { id: 2, title: 'B', status: 'draft', type: 'document', matiere_id: 7 },
  { id: 3, title: 'C', status: 'archived', type: 'tp', matiere_id: 8 }
]

vi.mock('@/services/lesson', () => ({
  default: {
    getLessons: () => Promise.resolve({ success: true, data: { data: lessonsPayload } })
  }
}))
vi.mock('@/services/klassci', () => ({
  klassciService: { getMatieres: () => Promise.resolve([{ id: 7, name: 'Maths' }]) }
}))

import { useTeacherLessons } from '@/composables/useTeacherLessons'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useTeacherLessons(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useTeacherLessons (#H4)', () => {
  beforeEach(() => { cacheStore = {}; push.mockClear() })

  it('charge les leçons depuis la structure paginée et calcule les stats', async () => {
    const c = await setup()
    expect(c.lessons.value).toHaveLength(3)
    expect(c.stats.value).toEqual({ total: 3, published: 1, draft: 1, archived: 1 })
  })

  it('filtre par statut et par matière', async () => {
    const c = await setup()
    c.filters.status = 'draft'
    expect(c.filteredLessons.value).toHaveLength(1)
    expect(c.filteredLessons.value[0].id).toBe(2)
    c.filters.status = ''
    c.filters.matiere_id = 8
    expect(c.filteredLessons.value).toHaveLength(1)
    expect(c.filteredLessons.value[0].id).toBe(3)
  })

  it('resetFilters remet tous les filtres à vide', async () => {
    const c = await setup()
    c.filters.status = 'draft'; c.filters.type = 'tp'; c.filters.matiere_id = 8
    c.resetFilters()
    expect(c.filters).toEqual({ matiere_id: '', status: '', type: '' })
  })

  it('viewChapters navigue vers les chapitres de la leçon', async () => {
    const c = await setup()
    c.viewChapters({ id: 42 })
    expect(push).toHaveBeenCalledWith('/teacher/lessons/42/chapters')
  })
})
