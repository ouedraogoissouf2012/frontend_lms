import { describe, it, expect, afterEach, vi } from 'vitest'
import { apiBaseUrl, apiOrigin } from '@/constants/http'

afterEach(() => vi.unstubAllEnvs())

describe('constants/http (#24)', () => {
  it('H1 — VITE_API_URL défini → base + origin', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.kalga.ci/api')
    expect(apiBaseUrl()).toBe('https://api.kalga.ci/api')
    expect(apiOrigin()).toBe('https://api.kalga.ci')
  })

  it('H2 — absent + PROD → throw sans exposer de valeur env', () => {
    vi.stubEnv('VITE_API_URL', '')
    vi.stubEnv('DEV', false)
    vi.stubEnv('PROD', true)
    expect(() => apiBaseUrl()).toThrow()
  })

  it('H3 — absent + DEV → fallback localhost confiné au dev', () => {
    vi.stubEnv('VITE_API_URL', '')
    vi.stubEnv('PROD', false)
    vi.stubEnv('DEV', true)
    expect(apiBaseUrl()).toBe('http://localhost:8000/api')
    expect(apiOrigin()).toBe('http://localhost:8000')
  })

  it('H4 — VITE_API_URL sans /api → origin inchangé', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.kalga.ci')
    expect(apiOrigin()).toBe('https://api.kalga.ci')
  })
})
