/**
 * Test de montage de ForumTopic (G6).
 * Service forum, store d'auth et vue-router (useRoute/useRouter) sont mockés ;
 * DashboardLayout est stubé. On vérifie le chargement du topic au montage et le
 * rendu de son titre. (Décompo #G1 : la logique vit dans useForumTopic, qui lit
 * la route via useRoute — d'où le mock vue-router au lieu des mocks $route/$router.)
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

const { getTopic } = vi.hoisted(() => ({
  getTopic: vi.fn(() => Promise.resolve({
    data: { id: 1, title: 'Sujet de discussion', user_id: 1, posts: [] }
  }))
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '1' } }),
  useRouter: () => ({ push: vi.fn() })
}))
vi.mock('@/services/api', () => ({
  forum: {
    getTopic,
    replyToTopic: vi.fn(() => Promise.resolve({})),
    markAsSolution: vi.fn(() => Promise.resolve({}))
  }
}))
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ currentUser: { id: 1, role: 'enseignant' } })
}))

import ForumTopic from '@/views/ForumTopic.vue'

function mountTopic() {
  return mount(ForumTopic, {
    global: {
      stubs: { DashboardLayout: { template: '<div><slot /></div>' } }
    }
  })
}

describe('ForumTopic (G6) — montage', () => {
  it('charge le topic au montage avec l\'id de la route', async () => {
    mountTopic()
    await flushPromises()
    expect(getTopic).toHaveBeenCalledWith('1')
  })

  it('affiche le titre du topic une fois chargé', async () => {
    const w = mountTopic()
    await flushPromises()
    expect(w.find('.forum-title').text()).toBe('Sujet de discussion')
  })
})
