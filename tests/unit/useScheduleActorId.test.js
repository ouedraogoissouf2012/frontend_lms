import { describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ user: null }))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ currentUser: state.user }),
}))

import { useScheduleActorId } from '@/composables/useScheduleActorId'

describe('useScheduleActorId (#330)', () => {
  it('uses local id when klassci_etudiant_id is absent', () => {
    state.user = { id: 42, role: 'etudiant' }
    expect(useScheduleActorId().actorId.value).toBe(42)
  })

  it('prefers klassci_etudiant_id for a student', () => {
    state.user = { id: 42, klassci_etudiant_id: 7, role: 'etudiant' }
    expect(useScheduleActorId().actorId.value).toBe(7)
  })

  it('uses local id when klassci_id is absent for a teacher', () => {
    state.user = { id: 9, role: 'enseignant' }
    expect(useScheduleActorId().actorId.value).toBe(9)
  })

  it('returns null without a user', () => {
    state.user = null
    expect(useScheduleActorId().actorId.value).toBeNull()
  })
})
