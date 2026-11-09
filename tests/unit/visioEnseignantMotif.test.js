/**
 * Liste visio de l'enseignant : un refus d'entrée dit son MOTIF, pas le texte technique.
 *
 * `handleJoinVisio` affichait `err.message` : sur un refus serveur (403 avec `reason`,
 * traduit par le catalogue depuis #452), l'enseignant lisait « Request failed with
 * status code 403 ». La forme du dépôt (`useTeacherSeances`, `useSeanceManagement`) est
 * `userMessage ?? message ?? catalogue` : le message du catalogue d'abord, puis le
 * message propre au front (ses `Error` en français, sans `userMessage`).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { normalizeError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { userError } from '@/utils/userError'

const { getMyTeachingSeances, joinTrackedVisio } = vi.hoisted(() => ({
  getMyTeachingSeances: vi.fn(),
  joinTrackedVisio: vi.fn(),
}))
vi.mock('@/services/lms', () => {
  const svc = { getMyTeachingSeances, activateVisio: vi.fn(), startVisio: vi.fn(), endVisio: vi.fn() }
  return { lmsService: svc, default: svc }
})
vi.mock('@/services/cache', () => ({ readCache: vi.fn(() => null), writeCache: vi.fn(), clearCache: vi.fn() }))
vi.mock('@/services/visioFeedback', () => ({ confirmVisioAction: vi.fn(() => Promise.resolve(true)) }))
vi.mock('@/composables/useTrackedVisioJoin', () => ({ useTrackedVisioJoin: () => ({ joinTrackedVisio }) }))

import { useTeacherVisioList } from '@/composables/useTeacherVisioList'

/** Erreur telle que l'intercepteur d'api.js la rend : corps serveur réel + `userMessage`. */
function refusServeur(status, corps) {
  const err = Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true, response: { status, data: corps },
  })
  err.userMessage = normalizeError(err).userMessage
  return err
}

async function monter() {
  getMyTeachingSeances.mockResolvedValue({ data: [] })
  let api
  mount(defineComponent({ setup() { api = useTeacherVisioList(); return () => null } }))
  await flushPromises()
  return api
}

beforeEach(() => {
  getMyTeachingSeances.mockReset()
  joinTrackedVisio.mockReset()
})

describe('handleJoinVisio — le motif du refus, jamais le texte technique', () => {
  it('un 403 teacher_not_owner dit le message du catalogue', async () => {
    joinTrackedVisio.mockRejectedValue(refusServeur(403, {
      success: false, message: "Vous n'êtes pas l'enseignant de cette séance", reason: 'teacher_not_owner',
    }))
    const u = await monter()
    await u.handleJoinVisio({ id: 12 })
    expect(u.error.value).toBe(ERROR_MESSAGES.visioTeacherNotOwner)
    expect(u.error.value).not.toMatch(/Request failed/)
  })

  it('une panne serveur dit le message du catalogue, pas « Request failed »', async () => {
    joinTrackedVisio.mockRejectedValue(refusServeur(500, { success: false, message: 'Erreur lors de la connexion' }))
    const u = await monter()
    await u.handleJoinVisio({ id: 12 })
    expect(u.error.value).toBe(ERROR_MESSAGES.server)
  })

  // Depuis #500, une erreur PROPRE au front porte son texte dans `userMessage` (userError),
  // comme le vrai joinTrackedVisio. Une erreur SANS userMessage n'est pas rédigée par le front
  // (TypeError, clé de fournisseur) : son message technique n'est jamais affiché (#506).
  it('une erreur PROPRE au front (userError) garde son message en français', async () => {
    joinTrackedVisio.mockRejectedValue(userError('Identifiant de séance visio introuvable.'))
    const u = await monter()
    await u.handleJoinVisio({ id: 12 })
    expect(u.error.value).toBe('Identifiant de séance visio introuvable.')
  })

  it('une erreur sans userMessage : le repli du front, jamais son message technique', async () => {
    joinTrackedVisio.mockRejectedValue(new Error('service_unavailable'))
    const u = await monter()
    await u.handleJoinVisio({ id: 12 })
    expect(u.error.value).toBe('Erreur lors de la connexion à la visio')
  })
})
