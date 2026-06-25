/**
 * Test du composable useForumTopic (#G1 ≤300) : chargement du sujet via le
 * service forum + id de route, droits canMarkAsSolution, publication de réponse,
 * marquage de solution et formatage de date. Services forum, store d'auth et
 * vue-router (useRoute/useRouter) sont mockés. Parité avec l'ancienne Options API.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getTopic, replyToTopic, markAsSolution, push } = vi.hoisted(() => ({
  getTopic: vi.fn(() => Promise.resolve({
    data: { id: 1, title: 'Sujet', user_id: 1, posts: [] }
  })),
  replyToTopic: vi.fn(() => Promise.resolve({})),
  markAsSolution: vi.fn(() => Promise.resolve({})),
  push: vi.fn(),
}))

let currentUser = { id: 1, role: 'enseignant' }

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '1' } }),
  useRouter: () => ({ push }),
}))
vi.mock('@/services/api', () => ({
  forum: { getTopic, replyToTopic, markAsSolution },
}))
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ currentUser }),
}))

import { useForumTopic } from '@/composables/useForumTopic'

function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useForumTopic(); return () => null } })
  mount(Comp)
  return api
}

describe('useForumTopic (#G1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentUser = { id: 1, role: 'enseignant' }
    global.confirm = vi.fn(() => true)
    global.alert = vi.fn()
  })

  it('charge le sujet au montage avec l\'id de la route et stocke response.data', async () => {
    const f = setup()
    await f.init()
    expect(getTopic).toHaveBeenCalledWith('1')
    expect(f.topic.value.title).toBe('Sujet')
    expect(f.loading.value).toBe(false)
  })

  it('canMarkAsSolution: vrai pour un enseignant', async () => {
    const f = setup()
    await f.init()
    expect(f.canMarkAsSolution({ id: 9 })).toBe(true)
  })

  it('canMarkAsSolution: faux sans utilisateur connecté', async () => {
    currentUser = null
    const f = setup()
    await f.init()
    expect(f.canMarkAsSolution({ id: 9 })).toBe(false)
  })

  it('submitReply publie le contenu puis recharge et vide le champ', async () => {
    const f = setup()
    await f.init()
    f.replyContent.value = 'Ma réponse'
    await f.submitReply()
    expect(replyToTopic).toHaveBeenCalledWith('1', 'Ma réponse')
    expect(f.replyContent.value).toBe('')
    expect(getTopic).toHaveBeenCalledTimes(2)
  })

  it('submitReply refuse un contenu vide (alerte, pas d\'appel)', async () => {
    const f = setup()
    await f.init()
    f.replyContent.value = '   '
    await f.submitReply()
    expect(replyToTopic).not.toHaveBeenCalled()
    expect(global.alert).toHaveBeenCalledWith('Veuillez écrire une réponse')
  })

  it('markAsSolution appelle le service après confirmation et recharge', async () => {
    const f = setup()
    await f.init()
    await f.markAsSolution(42)
    expect(markAsSolution).toHaveBeenCalledWith(42)
    expect(getTopic).toHaveBeenCalledTimes(2)
  })

  it('markAsSolution annulé si confirm refuse', async () => {
    global.confirm = vi.fn(() => false)
    const f = setup()
    await f.init()
    await f.markAsSolution(42)
    expect(markAsSolution).not.toHaveBeenCalled()
  })

  it('formatDate produit une date fr-FR', () => {
    const f = setup()
    const out = f.formatDate('2026-06-22T10:30:00Z')
    expect(typeof out).toBe('string')
    expect(out.length).toBeGreaterThan(0)
  })

  it('goToForum pousse vers /forum', () => {
    const f = setup()
    f.goToForum()
    expect(push).toHaveBeenCalledWith('/forum')
  })
})
