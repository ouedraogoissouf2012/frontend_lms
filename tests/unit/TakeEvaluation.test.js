/**
 * Test de montage de la vue TakeEvaluation (G3, Options API).
 * Services (evaluation + auth) mockés ; $route/$router injectés via global.mocks.
 * On exerce le chemin déterministe sans timer : utilisateur présent mais
 * submission_id absent → erreur « ID de soumission manquant ». Source intacte.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/services/evaluation', () => ({
  default: {
    getEvaluation: vi.fn().mockResolvedValue({ success: false }),
    submitEvaluation: vi.fn(),
    getTimeStatus: vi.fn()
  }
}))

vi.mock('@/services/api', () => ({
  default: { get: vi.fn() },
  auth: { getUser: vi.fn(() => ({ id: 1, name: 'Élève Test' })) }
}))

const stubs = {
  DashboardLayout: { template: '<div><slot /></div>' },
  ContentLoader: { template: '<div class="content-loader" />' }
}

function mountTake(routeOverrides = {}) {
  return import('@/views/evaluations/TakeEvaluation.vue').then(({ default: cmp }) =>
    mount(cmp, {
      global: {
        stubs,
        mocks: {
          $route: { params: { id: '1' }, query: {}, ...routeOverrides },
          $router: { push: vi.fn() }
        }
      }
    })
  )
}

describe('TakeEvaluation (G3) — montage', () => {
  it('monte sans erreur (conteneur présent)', async () => {
    const w = await mountTake()
    await flushPromises()
    expect(w.find('.take-evaluation-container').exists()).toBe(true)
  })

  it('submission_id manquant → erreur explicite et loading=false', async () => {
    const w = await mountTake({ query: {} })
    await flushPromises()
    expect(w.vm.error).toBe('ID de soumission manquant')
    expect(w.vm.loading).toBe(false)
  })
})
