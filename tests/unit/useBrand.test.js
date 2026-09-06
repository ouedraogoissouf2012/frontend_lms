import { describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ name: null }))

vi.mock('@/services/api', () => ({
  auth: { getInstitutionName: () => state.name },
}))

import { BRAND_FALLBACK } from '@/constants/brand'
import { useBrand } from '@/composables/useBrand'

describe('useBrand (#331)', () => {
  it('uses a neutral fallback when the institution has no name', () => {
    state.name = null
    expect(useBrand().productName.value).toBe(BRAND_FALLBACK)
    expect(useBrand().productName.value).not.toMatch(/klassci/i)
  })

  it('uses the institution name when present', () => {
    state.name = 'Lycée A'
    expect(useBrand().productName.value).toBe('Lycée A')
    expect(useBrand().copyright.value).toContain('Lycée A')
  })
})
