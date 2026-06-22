/**
 * Test de montage de la vue TeacherLessons (G5).
 * Vérifie le montage et le chargement des leçons (cache vide → appel API).
 */
import { shallowMount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

const getLessons = vi.fn().mockResolvedValue({ success: true, data: { data: [] } })
const getMatieres = vi.fn().mockResolvedValue([])
vi.mock('@/services/lesson', () => ({ default: { getLessons: (...a) => getLessons(...a) } }))
vi.mock('@/services/klassci', () => ({ klassciService: { getMatieres: (...a) => getMatieres(...a) } }))
vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: vi.fn() }))

import TeacherLessons from '@/views/lessons/TeacherLessons.vue'

describe('TeacherLessons (G5) — montage', () => {
  it('monte sans erreur et charge leçons + matières (cache vide → API)', async () => {
    const w = shallowMount(TeacherLessons)
    await flushPromises()
    expect(w.exists()).toBe(true)
    expect(getLessons).toHaveBeenCalled()
    expect(getMatieres).toHaveBeenCalled()
  })
})
