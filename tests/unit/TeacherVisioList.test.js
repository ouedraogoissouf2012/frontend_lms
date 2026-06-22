/**
 * Test de montage de TeacherVisioList.vue (G8 — Agent B).
 * Vue avec router + cache + services. On mocke :
 *  - @/services/lms (named lmsService.getMyTeachingSeances) → liste vide neutre
 *  - @/services/cache (readCache/writeCache/clearCache) → no-op (readCache=null pour forcer l'appel API)
 *  - @/constants/visio (buildJitsiUrl) → no-op
 * On stub DashboardLayout (layout lourd avec router/stores) et ContentLoader, et on fournit Pinia.
 * Assertion minimale : montage sans erreur + un conteneur racine .visio-container existe.
 */
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, it, expect, vi } from 'vitest'

const { getMyTeachingSeances } = vi.hoisted(() => ({
  getMyTeachingSeances: vi.fn(() => Promise.resolve({ data: [] }))
}))

vi.mock('@/services/lms', () => ({
  lmsService: { getMyTeachingSeances },
  default: { getMyTeachingSeances }
}))
vi.mock('@/services/cache', () => ({
  readCache: vi.fn(() => null),
  writeCache: vi.fn(),
  clearCache: vi.fn()
}))
vi.mock('@/constants/visio', () => ({ buildJitsiUrl: (id) => `https://meet.jit.si/${id}` }))

import TeacherVisioList from '@/views/teacher/TeacherVisioList.vue'

function mountView() {
  return mount(TeacherVisioList, {
    global: {
      plugins: [createPinia()],
      // DashboardLayout doit rendre son slot par défaut pour exposer le contenu
      stubs: {
        DashboardLayout: { template: '<div><slot /></div>' },
        ContentLoader: true,
        'router-link': true
      }
    }
  })
}

describe('TeacherVisioList.vue (G8) — montage', () => {
  it('monte sans erreur et expose le conteneur racine .visio-container', () => {
    const w = mountView()
    expect(w.find('.visio-container').exists()).toBe(true)
  })

  it('charge les séances au montage via le service', () => {
    mountView()
    expect(getMyTeachingSeances).toHaveBeenCalled()
  })
})
