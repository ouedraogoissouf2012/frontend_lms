import { describe, it, expect, vi, beforeEach } from 'vitest'

const { apiOriginMock } = vi.hoisted(() => ({ apiOriginMock: vi.fn() }))
vi.mock('@/constants/http', () => ({ apiOrigin: apiOriginMock }))

import { buildCspReport, reportCspViolation, installCspReporter } from '@/utils/cspReporter'

const sampleEvent = {
  documentURI: 'https://app/x',
  blockedURI: 'https://evil.example/',
  violatedDirective: 'connect-src',
  effectiveDirective: 'connect-src',
  disposition: 'report',
  sourceFile: 'https://app/main.js',
  lineNumber: 10,
  columnNumber: 5,
  originalPolicy: 'default-src self ... (ne doit PAS partir dans le rapport)',
  referrer: 'https://secret.referrer',
}

describe('buildCspReport', () => {
  it('ne garde que les champs utiles (pas originalPolicy/referrer)', () => {
    const r = buildCspReport(sampleEvent)
    expect(r).toEqual({
      documentURI: 'https://app/x',
      blockedURI: 'https://evil.example/',
      violatedDirective: 'connect-src',
      effectiveDirective: 'connect-src',
      disposition: 'report',
      sourceFile: 'https://app/main.js',
      lineNumber: 10,
      columnNumber: 5,
    })
    expect(r).not.toHaveProperty('originalPolicy')
    expect(r).not.toHaveProperty('referrer')
  })
})

describe('reportCspViolation', () => {
  beforeEach(() => {
    apiOriginMock.mockReset()
    navigator.sendBeacon = vi.fn(() => true)
  })

  it('envoie un beacon JSON vers <origin>/csp-report', () => {
    apiOriginMock.mockReturnValue('https://api.klassci.com')
    expect(reportCspViolation(sampleEvent)).toBe(true)
    expect(navigator.sendBeacon).toHaveBeenCalledWith(
      'https://api.klassci.com/csp-report',
      expect.any(Blob),
    )
  })

  it('no-op si aucune origine API', () => {
    apiOriginMock.mockReturnValue('')
    expect(reportCspViolation(sampleEvent)).toBe(false)
    expect(navigator.sendBeacon).not.toHaveBeenCalled()
  })

  it('no-op si apiOrigin lève (build mal configuré)', () => {
    apiOriginMock.mockImplementation(() => { throw new Error('VITE_API_URL requis') })
    expect(reportCspViolation(sampleEvent)).toBe(false)
    expect(navigator.sendBeacon).not.toHaveBeenCalled()
  })

  it('no-op si sendBeacon indisponible', () => {
    apiOriginMock.mockReturnValue('https://api.klassci.com')
    navigator.sendBeacon = undefined
    expect(reportCspViolation(sampleEvent)).toBe(false)
  })
})

describe('installCspReporter', () => {
  it('attache un écouteur securitypolicyviolation sur la cible', () => {
    const target = { addEventListener: vi.fn() }
    installCspReporter(target)
    expect(target.addEventListener).toHaveBeenCalledWith('securitypolicyviolation', reportCspViolation)
  })
})
