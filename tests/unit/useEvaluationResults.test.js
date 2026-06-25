/**
 * Test du composable useEvaluationResults (H2) : chargement de la soumission et
 * dérivation de l'état de correction (valeur API prioritaire). api/route mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('vue-router', () => ({ useRoute: () => ({ params: { id: '42' } }) }))

const get = vi.fn()
vi.mock('@/services/api', () => ({ default: { get: (...a) => get(...a) } }))

import { useEvaluationResults } from '@/composables/useEvaluationResults'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useEvaluationResults(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

beforeEach(() => { get.mockReset() })

describe('useEvaluationResults (H2)', () => {
  it('charge la soumission via /evaluations/:id/my-submission', async () => {
    get.mockResolvedValue({ success: true, data: { note_sur_20: 14, correction_available: true } })
    const u = await setup()
    expect(get).toHaveBeenCalledWith('/evaluations/42/my-submission')
    expect(u.submission.value.note_sur_20).toBe(14)
    expect(u.loading.value).toBe(false)
    expect(u.isCorrectionAvailable.value).toBe(true)
  })

  it('priorise correction_available=false de l\'API', async () => {
    get.mockResolvedValue({ success: true, data: { correction_available: false, submitted_at: '2020-01-01T00:00:00' } })
    const u = await setup()
    // Même avec une soumission ancienne, l'API fait foi
    expect(u.isCorrectionAvailable.value).toBe(false)
  })

  it('expose un message quand success=false', async () => {
    get.mockResolvedValue({ success: false, message: 'Indispo' })
    const u = await setup()
    expect(u.submission.value).toBe(null)
    expect(u.error.value).toBe('Indispo')
  })

  it('gère l\'exception réseau', async () => {
    get.mockRejectedValue(new Error('net'))
    const u = await setup()
    expect(u.error.value).toBe('Impossible de charger vos résultats')
    expect(u.loading.value).toBe(false)
  })
})
