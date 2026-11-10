/**
 * Test de montage de la vue StudentLessonView (G5 → #H4).
 * La logique est passée dans useStudentLessonView (composition) ; ce test vérifie le
 * montage + déclenchement du chargement (leçon + chapitres) par id de route.
 * Le comportement détaillé (progression, navigation, erreurs) est couvert dans
 * useStudentLessonView.test.js.
 */
import { shallowMount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getLesson = vi.fn()
const apiGet = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: { id: '5' } })
}))
vi.mock('@/services/lesson', () => ({ default: { getLesson: (...a) => getLesson(...a) } }))
vi.mock('@/services/api', () => ({ default: { get: (...a) => apiGet(...a) } }))
vi.mock('@/services/chapterProgress', () => ({ default: { markAsCompleted: vi.fn(), updateTimeSpent: vi.fn() } }))

import StudentLessonView from '@/views/student/StudentLessonView.vue'

describe('StudentLessonView (G5 → #H4) — montage', () => {
  beforeEach(() => {
    getLesson.mockReset()
    apiGet.mockReset()
  })

  it('monte sans erreur et charge leçon + chapitres par id de route', async () => {
    getLesson.mockResolvedValue({ success: true, data: { id: 5, title: 'L' } })
    apiGet.mockResolvedValue({ success: true, data: [{ id: 1, content_type: 'text' }] })
    const w = shallowMount(StudentLessonView)
    await flushPromises()
    expect(w.exists()).toBe(true)
    expect(getLesson).toHaveBeenCalledWith(5)
    expect(apiGet).toHaveBeenCalledWith('/lessons/5/chapters')
  })

  it('refus définitif (404) : le message, sans bouton « Réessayer »', async () => {
    getLesson.mockRejectedValue({ response: { status: 404 } })
    apiGet.mockResolvedValue({ success: true, data: [] })
    const w = shallowMount(StudentLessonView)
    await flushPromises()
    expect(w.find('.content-error').text()).toContain('Leçon introuvable')
    expect(w.find('.btn-retry').exists()).toBe(false)
  })

  it('panne passagère (500) : le bouton « Réessayer » reste là', async () => {
    getLesson.mockRejectedValue({ response: { status: 500 } })
    apiGet.mockResolvedValue({ success: true, data: [] })
    const w = shallowMount(StudentLessonView)
    await flushPromises()
    expect(w.find('.btn-retry').exists()).toBe(true)
  })
})
