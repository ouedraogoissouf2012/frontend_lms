/**
 * Test du composable useSeanceDetails (#H6) : chargement des détails, rôles
 * (isTeacher/isStudent), formatage date/heure, et garde-fous de joinVisio.
 * Services + router mockés (cf. tests/unit/useAdminUsers.test.js).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getSeanceDetails = vi.fn()
const startVisio = vi.fn()
const hideSeance = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '42' }, query: {} }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), go: vi.fn() })
}))
vi.mock('@/services/lms', () => {
  const def = {
    getSeanceDetails: (...a) => getSeanceDetails(...a),
    startVisio: (...a) => startVisio(...a),
    hideSeance: (...a) => hideSeance(...a),
    leaveVisio: vi.fn()
  }
  return { default: def, lmsService: def }
})
let currentUser = { role: 'coordinateur', name: 'Prof X' }
vi.mock('@/services/api', () => ({ auth: { getUser: () => currentUser } }))
vi.mock('@/services/toast', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
vi.mock('@/services/errorHandler', () => ({ normalizeError: () => ({ userMessage: 'err' }) }))
vi.mock('@/composables/useVisioParticipation', () => ({
  useVisioParticipation: () => ({ joinVisio: vi.fn(), leaveVisio: vi.fn() })
}))

import { useSeanceDetails } from '@/composables/useSeanceDetails'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useSeanceDetails(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useSeanceDetails (#H6)', () => {
  beforeEach(() => {
    getSeanceDetails.mockReset()
    currentUser = { role: 'coordinateur', name: 'Prof X' }
  })

  it('charge les détails au montage et expose seance/visio', async () => {
    getSeanceDetails.mockResolvedValue({
      success: true,
      data: {
        seance: { id: 42, matiere: { nom: 'Maths' } },
        visio: { enabled: true, status: 'programmee' },
        participants: { teacher: { nom: 'X' }, students: [], total: 1 }
      }
    })
    const u = await setup()
    expect(getSeanceDetails).toHaveBeenCalledWith(42)
    expect(u.seance.value.matiere.nom).toBe('Maths')
    expect(u.visio.value.enabled).toBe(true)
    expect(u.participants.value.total).toBe(1)
    expect(u.loading.value).toBe(false)
  })

  it('rôles : coordinateur = isTeacher, pas isStudent', async () => {
    getSeanceDetails.mockResolvedValue({ success: false, data: {} })
    const u = await setup()
    expect(u.isTeacher.value).toBe(true)
    expect(u.isStudent.value).toBe(false)
    expect(u.error.value).toBe('Séance non trouvée')
  })

  it('rôle étudiant accentué reconnu, participants par défaut', async () => {
    currentUser = { role: 'étudiant', name: 'Eleve' }
    getSeanceDetails.mockResolvedValue({
      success: true,
      data: { seance: { id: 42 }, visio: null }
    })
    const u = await setup()
    expect(u.isStudent.value).toBe(true)
    expect(u.isTeacher.value).toBe(false)
    expect(u.participants.value).toEqual({ teacher: null, students: [], total: 0 })
  })

  it('formatDate/formatTime : replis « Non défini »', async () => {
    getSeanceDetails.mockResolvedValue({ success: false, data: {} })
    const u = await setup()
    expect(u.formatDate(null)).toBe('Non défini')
    expect(u.formatTime(null)).toBe('Non défini')
  })

  it('joinVisio : refuse si visio non active (alerte, pas de crash)', async () => {
    getSeanceDetails.mockResolvedValue({
      success: true,
      data: { seance: { id: 42 }, visio: { enabled: true, status: 'programmee' } }
    })
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const u = await setup()
    await u.joinVisio()
    expect(alertSpy).toHaveBeenCalled()
    expect(u.joiningVisio.value).toBe(false)
    alertSpy.mockRestore()
  })
})
