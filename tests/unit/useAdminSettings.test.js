/**
 * Test du composable useAdminSettings (#H3 ≤300) : utilisateur courant via auth,
 * libellé de rôle, persistance localStorage des préférences, indisponibilité du
 * changement de mot de passe et déconnexion. Services `auth`, `toast` et
 * le routeur sont mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUser = {
  nom: 'Dupont',
  prenom: 'Marie',
  email: 'marie@e.com',
  role: 'admin',
  permissions: ['users:read'],
}

const logoutSpy = vi.fn()
vi.mock('@/services/api', () => ({
  auth: { getUser: () => mockUser, logout: () => logoutSpy() },
}))

const toastSpies = { success: vi.fn(), error: vi.fn(), info: vi.fn() }
vi.mock('@/services/toast', () => ({
  toast: {
    success: (m) => toastSpies.success(m),
    error: (m) => toastSpies.error(m),
    info: (m) => toastSpies.info(m),
  },
}))

const pushSpy = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push: pushSpy }) }))

import { useAdminSettings } from '@/composables/useAdminSettings'
import { PASSWORD_CHANGE_UNAVAILABLE_MESSAGE } from '@/constants/passwordChange'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminSettings(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useAdminSettings (#H3)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('charge l\'utilisateur courant au montage', async () => {
    const s = await setup()
    expect(s.user.value).toEqual(mockUser)
  })

  it('expose le libellé de rôle traduit, brut si inconnu', async () => {
    const s = await setup()
    expect(s.getRoleLabel('admin')).toBe('Administrateur')
    expect(s.getRoleLabel('inconnu')).toBe('inconnu')
  })

  it('savePreferences persiste en localStorage et notifie', async () => {
    const s = await setup()
    s.emailNotifications.value = false
    s.savePreferences()
    const stored = JSON.parse(localStorage.getItem('adminPreferences'))
    expect(stored).toEqual({ emailNotifications: false, systemAlerts: true })
    expect(toastSpies.success).toHaveBeenCalledWith('Vos préférences ont été sauvegardées')
  })

  it('loadPreferences au montage restaure les valeurs sauvegardées', async () => {
    localStorage.setItem('adminPreferences', JSON.stringify({ emailNotifications: false, systemAlerts: false }))
    const s = await setup()
    expect(s.emailNotifications.value).toBe(false)
    expect(s.systemAlerts.value).toBe(false)
  })

  it('submitPasswordChange n\'annonce jamais de succès et informe de l\'indisponibilité', async () => {
    const s = await setup()
    s.showPasswordModal.value = true
    s.passwordForm.currentPassword = 'old'
    s.passwordForm.newPassword = 'abcdef'
    s.passwordForm.confirmPassword = 'abcdef'
    s.submitPasswordChange()
    expect(toastSpies.success).not.toHaveBeenCalled()
    expect(toastSpies.info).toHaveBeenCalledWith(PASSWORD_CHANGE_UNAVAILABLE_MESSAGE)
  })

  it('logout déconnecte et redirige après confirmation', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const s = await setup()
    s.logout()
    expect(logoutSpy).toHaveBeenCalled()
    expect(pushSpy).toHaveBeenCalledWith('/login')
    confirmSpy.mockRestore()
  })

  it('logout annulé ne déconnecte pas', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const s = await setup()
    s.logout()
    expect(logoutSpy).not.toHaveBeenCalled()
    expect(pushSpy).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })
})
