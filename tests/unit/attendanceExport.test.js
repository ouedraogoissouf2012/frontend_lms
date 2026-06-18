/**
 * Tests du service d'export des présences (#28, tranche 2).
 * Vérifie l'URL et le header Accept par format, et la levée d'erreur sur échec.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ token: 'TEST_TOKEN' }) }))
vi.mock('@/constants/http', () => ({ apiBaseUrl: () => 'http://api.test/api' }))

import attendanceExportService from '@/services/attendanceExport'

describe('services/attendanceExport (#28)', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, blob: () => Promise.resolve(new Blob(['x'])) })
    )
    window.URL.createObjectURL = vi.fn(() => 'blob:mock')
    window.URL.revokeObjectURL = vi.fn()
  })

  it('exportPdf : appelle le bon endpoint avec Accept application/pdf + Bearer', async () => {
    await attendanceExportService.exportPdf(42)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://api.test/api/lms/seances/42/export/presences/pdf',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer TEST_TOKEN',
          Accept: 'application/pdf'
        })
      })
    )
  })

  it('exportExcel : endpoint excel + Accept xlsx', async () => {
    await attendanceExportService.exportExcel(7)
    const [url, opts] = global.fetch.mock.calls[0]
    expect(url).toBe('http://api.test/api/lms/seances/7/export/presences/excel')
    expect(opts.headers.Accept).toContain('spreadsheetml.sheet')
  })

  it('lève l\'erreur libellée si la réponse n\'est pas ok', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false }))
    await expect(attendanceExportService.exportPdf(1)).rejects.toThrow('Erreur lors du téléchargement du PDF')
    await expect(attendanceExportService.exportExcel(1)).rejects.toThrow('Erreur lors du téléchargement du fichier Excel')
  })
})
