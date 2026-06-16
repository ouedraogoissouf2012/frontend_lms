import { describe, it, expect } from 'vitest'
import {
  STORAGE_KEYS,
  VISIO_PARTICIPATION_PREFIX,
  themeKey,
  sidebarKey,
  visioParticipationKey,
} from '@/constants/storageKeys'

describe('constants/storageKeys (#24)', () => {
  it('S1 — STORAGE_KEYS gelé', () => {
    expect(Object.isFrozen(STORAGE_KEYS)).toBe(true)
  })

  it('S2/S3 — themeKey scopé + fallback default', () => {
    expect(themeKey('esi')).toBe('lms-theme-preference-esi')
    expect(themeKey(null)).toBe('lms-theme-preference-default')
  })

  it('S4 — sidebarKey scopé + fallback', () => {
    expect(sidebarKey('esi')).toBe('sidebar-collapsed-esi')
    expect(sidebarKey()).toBe('sidebar-collapsed-default')
  })

  it('S5 — visioParticipationKey', () => {
    expect(visioParticipationKey(12, 7)).toBe('visio_participation_12_7')
  })

  it('S6 — valeurs plates + préfixe', () => {
    expect(STORAGE_KEYS.ADMIN_PREFERENCES).toBe('adminPreferences')
    expect(STORAGE_KEYS.TEACHER_PREFERENCES).toBe('teacherPreferences')
    expect(STORAGE_KEYS.USER_PREFERENCES).toBe('userPreferences')
    expect(VISIO_PARTICIPATION_PREFIX).toBe('visio_participation_')
  })
})
