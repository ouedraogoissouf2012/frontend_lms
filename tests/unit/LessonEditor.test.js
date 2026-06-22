/**
 * Test de montage de la vue LessonEditor (G5).
 * Vérifie le montage en mode création (sans id de route) et le chargement des
 * référentiels (matières/classes) au montage.
 */
import { shallowMount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {} }),
  useRouter: () => ({ push: vi.fn(), go: vi.fn() })
}))

const getMatieres = vi.fn().mockResolvedValue([])
const getClasses = vi.fn().mockResolvedValue([])
vi.mock('@/services/klassci', () => ({
  klassciService: { getMatieres: (...a) => getMatieres(...a), getClasses: (...a) => getClasses(...a) }
}))
vi.mock('@/services/lesson', () => ({
  default: { getLesson: vi.fn(), createLesson: vi.fn(), updateLesson: vi.fn(), deleteLesson: vi.fn() }
}))
vi.mock('@/services/chapter', () => ({
  default: { getChapters: vi.fn().mockResolvedValue({ success: true, data: [] }) }
}))
vi.mock('@/services/toast', () => ({ toast: { error: vi.fn() } }))
vi.mock('@/services/errorHandler', () => ({ normalizeError: (e) => ({ userMessage: String(e) }) }))

import LessonEditor from '@/views/lessons/LessonEditor.vue'

describe('LessonEditor (G5) — montage', () => {
  it('monte en mode création et charge matières + classes au montage', async () => {
    const w = shallowMount(LessonEditor)
    await flushPromises()
    expect(w.exists()).toBe(true)
    expect(getMatieres).toHaveBeenCalled()
    expect(getClasses).toHaveBeenCalled()
  })
})
