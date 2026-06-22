/**
 * Test de montage de la vue StudentLessonView (G5).
 * Vérifie le montage et le chargement (leçon + chapitres) avec parité des routes.
 */
import { shallowMount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getLesson = vi.fn()
const apiGet = vi.fn()
vi.mock('@/services/lesson', () => ({ default: { getLesson: (...a) => getLesson(...a) } }))
vi.mock('@/services/api', () => ({ default: { get: (...a) => apiGet(...a) } }))
vi.mock('@/services/chapterProgress', () => ({ default: { markComplete: vi.fn() } }))

import StudentLessonView from '@/views/student/StudentLessonView.vue'

function mountView() {
  return shallowMount(StudentLessonView, {
    global: { mocks: { $route: { params: { id: '5' } } } }
  })
}

describe('StudentLessonView (G5) — montage', () => {
  beforeEach(() => {
    getLesson.mockReset()
    apiGet.mockReset()
  })

  it('monte sans erreur et charge leçon + chapitres par id de route', async () => {
    getLesson.mockResolvedValue({ success: true, data: { id: 5, title: 'L' } })
    apiGet.mockResolvedValue({ success: true, data: [{ id: 1, content_type: 'text' }] })
    const w = mountView()
    await flushPromises()
    expect(getLesson).toHaveBeenCalledWith(5)
    expect(apiGet).toHaveBeenCalledWith('/lessons/5/chapters')
    expect(w.vm.chapters).toHaveLength(1)
  })

  it('overallProgress vaut 0 quand aucun chapitre', () => {
    const w = mountView()
    expect(w.vm.overallProgress).toBe(0)
  })
})
