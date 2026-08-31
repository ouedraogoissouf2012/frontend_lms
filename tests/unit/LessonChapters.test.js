/**
 * Test de montage de la vue LessonChapters (G5).
 * Vérifie le montage et le chargement de la leçon (parité route `getLesson`).
 */
import { shallowMount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getLesson = vi.fn()
vi.mock('@/services/lesson', () => ({
  default: { getLesson: (...a) => getLesson(...a), publishLesson: vi.fn() }
}))
vi.mock('@/composables/useToast', () => ({ toast: { error: vi.fn() } }))
vi.mock('@/services/errorHandler', () => ({ normalizeError: (e) => ({ userMessage: String(e) }) }))

import LessonChapters from '@/views/lessons/LessonChapters.vue'

function mountView() {
  return shallowMount(LessonChapters, {
    global: {
      mocks: {
        $route: { params: { id: '12' }, query: {} },
        $router: { push: vi.fn(), back: vi.fn(), resolve: () => ({ href: '/x' }) }
      }
    }
  })
}

describe('LessonChapters (G5) — montage', () => {
  beforeEach(() => getLesson.mockReset())

  it('monte sans erreur et charge la leçon par son id de route', async () => {
    getLesson.mockResolvedValue({ success: true, data: { id: 12, title: 'L', matiere_id: 3 } })
    const w = mountView()
    await flushPromises()
    expect(getLesson).toHaveBeenCalledWith(12)
    expect(w.vm.lesson).toEqual({ id: 12, title: 'L', matiere_id: 3 })
  })

  it('mode lecture seule uniquement si ?readonly=true', () => {
    const w = mountView()
    expect(w.vm.isReadOnly).toBe(false)
  })
})
