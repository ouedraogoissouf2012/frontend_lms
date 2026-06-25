/**
 * Test du composable usePreviewEvaluation (H1 ≤300) : chargement de la
 * prévisualisation, simulation des réponses + progression, et publication.
 * Service evaluation + vue-router + confirm/alert mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  preview: vi.fn(),
  publish: vi.fn(),
  push: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '7' } }),
  useRouter: () => ({ push: h.push })
}))
vi.mock('@/services/evaluation', () => ({
  default: { previewEvaluation: h.preview, publishEvaluation: h.publish }
}))

import { usePreviewEvaluation } from '@/composables/usePreviewEvaluation'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = usePreviewEvaluation(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('usePreviewEvaluation (H1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('alert', vi.fn())
    vi.stubGlobal('confirm', vi.fn(() => true))
    h.preview.mockResolvedValue({
      success: true,
      data: { id: 7, titre: 'T', questions_count: 2, questions: [{ id: 'a' }, { id: 'b' }] }
    })
    h.publish.mockResolvedValue({ success: true })
  })

  it('charge la prévisualisation au montage', async () => {
    const c = await setup()
    expect(c.loading.value).toBe(false)
    expect(c.evaluation.value.id).toBe(7)
  })

  it('met error si le chargement échoue', async () => {
    h.preview.mockResolvedValue({ success: false, message: 'KO' })
    const c = await setup()
    expect(c.error.value).toBe('KO')
  })

  it('selectAnswer alimente progression et pourcentage', async () => {
    const c = await setup()
    expect(c.answeredCount.value).toBe(0)
    c.selectAnswer('a', 'Option 1')
    expect(c.answeredCount.value).toBe(1)
    expect(c.progressPercentage.value).toBe(50)
  })

  it('publishEvaluation publie après confirmation puis redirige', async () => {
    const c = await setup()
    await c.publishEvaluation()
    expect(h.publish).toHaveBeenCalledWith(7)
    expect(h.push).toHaveBeenCalledWith({ name: 'TeacherEvaluations' })
  })

  it('publishEvaluation annulé si confirm refuse', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    const c = await setup()
    await c.publishEvaluation()
    expect(h.publish).not.toHaveBeenCalled()
  })

  it('goBack redirige vers la liste enseignant', async () => {
    const c = await setup()
    c.goBack()
    expect(h.push).toHaveBeenCalledWith({ name: 'TeacherEvaluations' })
  })
})
