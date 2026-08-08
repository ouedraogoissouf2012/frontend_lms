/**
 * Test du composable useTeacherSettings (#H11 ≤300) : préférences persistées
 * (localStorage), indisponibilité du changement de mot de passe, déconnexion.
 * Services auth + toast + router mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { authMock, toastMock, pushMock } = vi.hoisted(() => ({
  authMock: { getUser: vi.fn(), logout: vi.fn() },
  toastMock: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
  pushMock: vi.fn(),
}))

vi.mock('@/services/api', () => ({ auth: authMock }))
vi.mock('@/services/toast', () => ({ toast: toastMock }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: pushMock }) }))

import { useTeacherSettings } from '@/composables/useTeacherSettings'
import { STORAGE_KEYS } from '@/constants/storageKeys'
import { PASSWORD_CHANGE_UNAVAILABLE_MESSAGE } from '@/constants/passwordChange'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useTeacherSettings(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useTeacherSettings (#H11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    authMock.getUser.mockReturnValue({ nom: 'Prof', role: 'enseignant' })
  })

  it('charge les préférences depuis localStorage au montage', async () => {
    localStorage.setItem(STORAGE_KEYS.TEACHER_PREFERENCES, JSON.stringify({ emailNotifications: false, seanceReminders: true }))
    const s = await setup()
    expect(s.emailNotifications.value).toBe(false)
    expect(s.seanceReminders.value).toBe(true)
  })

  it('persiste les préférences et notifie au save', async () => {
    const s = await setup()
    s.emailNotifications.value = false
    s.savePreferences()
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEACHER_PREFERENCES))
    expect(saved.emailNotifications).toBe(false)
    expect(toastMock.success).toHaveBeenCalled()
  })

  it('n\'annonce jamais de succès de changement de mot de passe', async () => {
    const s = await setup()
    s.showPasswordModal.value = true
    s.passwordForm.newPassword = 'secret1'
    s.passwordForm.confirmPassword = 'secret1'
    s.submitPasswordChange()
    expect(toastMock.success).not.toHaveBeenCalled()
    expect(toastMock.info).toHaveBeenCalledWith(PASSWORD_CHANGE_UNAVAILABLE_MESSAGE)
  })

  it('déconnecte après confirmation', async () => {
    vi.stubGlobal('confirm', () => true)
    const s = await setup()
    s.logout()
    expect(authMock.logout).toHaveBeenCalled()
    expect(pushMock).toHaveBeenCalledWith('/login')
    vi.unstubAllGlobals()
  })

  it('ne déconnecte pas si l\'utilisateur annule', async () => {
    vi.stubGlobal('confirm', () => false)
    const s = await setup()
    s.logout()
    expect(authMock.logout).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
