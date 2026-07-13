/**
 * Test du composable useSeanceDetails (#H6) : chargement des détails, rôles
 * (isTeacher/isStudent), formatage date/heure, et garde-fous de joinVisio.
 * Services + router mockés (cf. tests/unit/useAdminUsers.test.js).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const getSeanceDetails = vi.fn()
const startVisio = vi.fn()
const getVisioRecording = vi.fn()
const startVisioRecording = vi.fn()
const stopVisioRecording = vi.fn()
const hideSeance = vi.fn()
const storeJoinVisio = vi.fn()
const confirmDialog = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '42' }, query: {} }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), go: vi.fn() })
}))
vi.mock('@/services/lms', () => {
  const def = {
    getSeanceDetails: (...a) => getSeanceDetails(...a),
    startVisio: (...a) => startVisio(...a),
    getVisioRecording: (...a) => getVisioRecording(...a),
    startVisioRecording: (...a) => startVisioRecording(...a),
    stopVisioRecording: (...a) => stopVisioRecording(...a),
    hideSeance: (...a) => hideSeance(...a),
    leaveVisio: vi.fn()
  }
  return { default: def, lmsService: def }
})
let currentUser = { role: 'coordinateur', name: 'Prof X' }
vi.mock('@/services/api', () => ({ auth: { getUser: () => currentUser } }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ currentUser }) }))
vi.mock('@/stores/visio', () => ({
  useVisioStore: () => ({ joinVisio: (...a) => storeJoinVisio(...a) })
}))
vi.mock('@/services/toast', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }))
vi.mock('@/services/errorHandler', () => ({ normalizeError: () => ({ userMessage: 'err' }) }))
vi.mock('@/services/confirmDialog', () => ({ confirmDialog: (...a) => confirmDialog(...a) }))

import { useSeanceDetails } from '@/composables/useSeanceDetails'
import { toast } from '@/services/toast'

const mountedWrappers = []

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useSeanceDetails(); return () => null } })
  mountedWrappers.push(mount(Comp))
  await flushPromises()
  return api
}

describe('useSeanceDetails (#H6)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    getSeanceDetails.mockReset()
    startVisio.mockReset()
    getVisioRecording.mockReset()
    startVisioRecording.mockReset()
    stopVisioRecording.mockReset()
    hideSeance.mockReset()
    storeJoinVisio.mockReset()
    confirmDialog.mockReset()
    confirmDialog.mockResolvedValue(true)
    storeJoinVisio.mockResolvedValue({ success: true })
    getVisioRecording.mockResolvedValue({ success: true, data: { recording: { status: 'ready' } } })
    toast.success.mockClear()
    toast.error.mockClear()
    toast.info.mockClear()
    toast.warning.mockClear()
    currentUser = { role: 'coordinateur', name: 'Prof X' }
  })

  afterEach(() => {
    while (mountedWrappers.length) mountedWrappers.pop().unmount()
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
    expect(u.canManageRecording.value).toBe(false)
    expect(u.error.value).toBe('Séance non trouvée')
  })

  it('rôle enseignant : peut gérer l’enregistrement', async () => {
    currentUser = { role: 'enseignant', name: 'Prof X' }
    getSeanceDetails.mockResolvedValue({ success: false, data: {} })
    const u = await setup()
    expect(u.canManageRecording.value).toBe(true)
    expect(u.recordingProviderEnabled.value).toBe(false)
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

  it('joinVisio : refuse si visio non active (toast, pas de crash)', async () => {
    getSeanceDetails.mockResolvedValue({
      success: true,
      data: { seance: { id: 42 }, visio: { enabled: true, status: 'programmee' } }
    })
    const u = await setup()
    await u.joinVisio()
    expect(toast.warning).toHaveBeenCalledWith(
      'La visioconférence n\'est pas encore active. Veuillez attendre que l\'enseignant démarre le cours.',
      'Visio',
    )
    expect(u.joiningVisio.value).toBe(false)
  })

  it('startVisio : refuse une réponse API sans visio_room_id', async () => {
    getSeanceDetails.mockResolvedValue({
      success: true,
      data: { seance: { id: 42 }, visio: { enabled: true, status: 'programmee', room_id: 'old-room' } }
    })
    startVisio.mockResolvedValue({ success: true, data: {} })
    const u = await setup()
    await u.startVisio()

    expect(storeJoinVisio).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('Identifiant de salle visio introuvable dans la réponse API.', 'Visio')
  })

  it('joinVisio : refuse une visio active sans room API', async () => {
    currentUser = { role: 'etudiant', name: 'Eleve' }
    getSeanceDetails.mockResolvedValue({
      success: true,
      data: { seance: { id: 42 }, visio: { enabled: true, status: 'active' } }
    })

    const u = await setup()
    await u.joinVisio()

    expect(storeJoinVisio).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Identifiant de salle visio'),
      'Visio',
    )
  })

  it('startVisio : utilise VITE_JITSI_DOMAIN au lieu de meet.jit.si', async () => {
    vi.stubEnv('VITE_JITSI_DOMAIN', 'visio.ecole.test')
    getSeanceDetails.mockResolvedValue({
      success: true,
      data: { seance: { id: 42 }, visio: { enabled: true, status: 'programmee' } }
    })
    startVisio.mockResolvedValue({ success: true, data: { visio_room_id: 'room-api-start' } })

    const u = await setup()
    await u.startVisio()

    expect(storeJoinVisio).toHaveBeenCalledWith(
      42,
      'https://visio.ecole.test/room-api-start#config.prejoinConfig.enabled=false&userInfo.displayName=Prof%20X',
    )
  })

  it('joinVisio : utilise VITE_JITSI_DOMAIN au lieu de meet.jit.si', async () => {
    vi.stubEnv('VITE_JITSI_DOMAIN', 'visio.ecole.test')
    currentUser = { role: 'etudiant', name: 'Eleve Test' }
    getSeanceDetails.mockResolvedValue({
      success: true,
      data: {
        seance: { id: 42 },
        visio: { enabled: true, status: 'active', visio_room_id: 'room-api-join' }
      }
    })

    const u = await setup()
    await u.joinVisio()

    expect(storeJoinVisio).toHaveBeenCalledWith(
      42,
      'https://visio.ecole.test/room-api-join#config.prejoinConfig.enabled=false&userInfo.displayName=Eleve%20Test',
    )
  })

  it('startRecording : refuse si la séance visio n’est pas active', async () => {
    vi.stubEnv('VITE_VISIO_RECORDING_ENABLED', 'true')
    currentUser = { role: 'enseignant', name: 'Prof X' }
    getSeanceDetails.mockResolvedValue({
      success: true,
      data: { seance: { id: 42 }, visio: { enabled: true, status: 'programmee' } }
    })

    const u = await setup()
    await u.startRecording()

    expect(startVisioRecording).not.toHaveBeenCalled()
    expect(toast.warning).toHaveBeenCalledWith(
      "L'enregistrement est disponible uniquement pendant une séance active.",
      'Visio',
    )
  })

  it('startRecording : refuse si aucun provider recording n’est activé', async () => {
    currentUser = { role: 'enseignant', name: 'Prof X' }
    getSeanceDetails.mockResolvedValue({
      success: true,
      data: { seance: { id: 42 }, visio: { enabled: true, status: 'active' } }
    })

    const u = await setup()
    await u.startRecording()

    expect(startVisioRecording).not.toHaveBeenCalled()
    expect(confirmDialog).not.toHaveBeenCalled()
    expect(toast.warning).toHaveBeenCalledWith(
      "L'enregistrement n'est pas activé sur cette plateforme.",
      'Visio',
    )
  })

  it('startRecording : respecte un signal backend provider false', async () => {
    vi.stubEnv('VITE_VISIO_RECORDING_ENABLED', 'true')
    currentUser = { role: 'enseignant', name: 'Prof X' }
    getSeanceDetails.mockResolvedValue({
      success: true,
      data: {
        seance: { id: 42 },
        visio: { enabled: true, status: 'active', recording_provider_enabled: false }
      }
    })

    const u = await setup()
    expect(u.recordingProviderEnabled.value).toBe(false)
    await u.startRecording()

    expect(startVisioRecording).not.toHaveBeenCalled()
    expect(toast.warning).toHaveBeenCalledWith(
      "L'enregistrement n'est pas activé sur cette plateforme.",
      'Visio',
    )
  })

  it('startRecording : appelle le backend et applique le statut retourné', async () => {
    vi.stubEnv('VITE_VISIO_RECORDING_ENABLED', 'true')
    currentUser = { role: 'enseignant', name: 'Prof X' }
    getSeanceDetails.mockResolvedValue({
      success: true,
      data: { seance: { id: 42 }, visio: { enabled: true, status: 'active' } }
    })
    startVisioRecording.mockResolvedValue({
      success: true,
      data: { recording: { status: 'recording' } }
    })
    getVisioRecording.mockResolvedValue({
      success: true,
      data: { recording: { status: 'recording' } }
    })

    const u = await setup()
    await u.startRecording()

    expect(confirmDialog).toHaveBeenCalled()
    expect(startVisioRecording).toHaveBeenCalledWith(42)
    expect(u.visio.value.recording.status).toBe('recording')
    expect(toast.success).toHaveBeenCalledWith('Enregistrement démarré.', 'Visio')
  })

  it('stopRecording : appelle le backend et applique le statut retourné', async () => {
    vi.stubEnv('VITE_VISIO_RECORDING_ENABLED', 'true')
    currentUser = { role: 'enseignant', name: 'Prof X' }
    getSeanceDetails.mockResolvedValue({
      success: true,
      data: {
        seance: { id: 42 },
        visio: { enabled: true, status: 'active', recording: { status: 'recording' } }
      }
    })
    stopVisioRecording.mockResolvedValue({
      success: true,
      data: { recording: { status: 'processing' } }
    })
    getVisioRecording.mockResolvedValue({
      success: true,
      data: { recording: { status: 'processing' } }
    })

    const u = await setup()
    await u.stopRecording()

    expect(confirmDialog).toHaveBeenCalled()
    expect(stopVisioRecording).toHaveBeenCalledWith(42)
    expect(u.visio.value.recording.status).toBe('processing')
    expect(toast.success).toHaveBeenCalledWith("Arrêt de l'enregistrement demandé.", 'Visio')
  })
})
