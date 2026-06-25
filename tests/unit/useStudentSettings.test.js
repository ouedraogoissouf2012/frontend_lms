/**
 * Test du composable useStudentSettings (#H10) : user courant lu au montage,
 * persistance des préférences (localStorage + toast) et mapping de rôle.
 * api(auth)/toast/storageKeys/router mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  getUser: vi.fn(),
  logout: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  push: vi.fn(),
}))

vi.mock('@/services/api', () => ({ auth: { getUser: (...a) => h.getUser(...a), logout: (...a) => h.logout(...a) } }))
vi.mock('@/services/toast', () => ({ toast: { success: (...a) => h.success(...a), error: (...a) => h.error(...a) } }))
vi.mock('@/constants/storageKeys', () => ({ STORAGE_KEYS: { USER_PREFERENCES: 'user_preferences' } }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: h.push }) }))

import { useStudentSettings } from '@/composables/useStudentSettings'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useStudentSettings(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useStudentSettings (#H10)', () => {
  beforeEach(() => {
    localStorage.clear()
    h.getUser.mockReset().mockReturnValue({ id: 2, nom: 'Roe', prenom: 'Jane', role: 'etudiant' })
    h.success.mockReset(); h.error.mockReset(); h.push.mockReset(); h.logout.mockReset()
  })

  it('lit le user courant au montage', async () => {
    const s = await setup()
    expect(h.getUser).toHaveBeenCalled()
    expect(s.user.value).toMatchObject({ nom: 'Roe', prenom: 'Jane' })
  })

  it('charge les préférences depuis localStorage au montage', async () => {
    localStorage.setItem('user_preferences', JSON.stringify({ emailNotifications: false, visioReminders: true }))
    const s = await setup()
    expect(s.emailNotifications.value).toBe(false)
    expect(s.visioReminders.value).toBe(true)
  })

  it('savePreferences persiste et notifie', async () => {
    const s = await setup()
    s.emailNotifications.value = false
    s.savePreferences()
    expect(JSON.parse(localStorage.getItem('user_preferences'))).toEqual({ emailNotifications: false, visioReminders: true })
    expect(h.success).toHaveBeenCalledWith('Vos préférences ont été sauvegardées')
  })

  it('getRoleLabel mappe les rôles connus et retombe sur la valeur brute', async () => {
    const s = await setup()
    expect(s.getRoleLabel('etudiant')).toBe('Étudiant')
    expect(s.getRoleLabel('teacher')).toBe('Enseignant')
    expect(s.getRoleLabel('inconnu')).toBe('inconnu')
  })
})
