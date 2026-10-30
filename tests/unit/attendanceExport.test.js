/**
 * Tests du service d'export des présences (#28, tranche 2).
 * Vérifie l'URL et le header Accept par format, et la levée d'erreur sur échec.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ token: 'TEST_TOKEN' }) }))
vi.mock('@/constants/http', () => ({ apiBaseUrl: () => 'http://api.test/api', API_TIMEOUT_MS: 30000 }))
const telechargerFichier = vi.hoisted(() => vi.fn())
vi.mock('@/utils/downloadBlob', () => ({ downloadBlob: telechargerFichier }))

import attendanceExportService from '@/services/attendanceExport'

describe('services/attendanceExport (#28)', () => {
  beforeEach(() => {
    telechargerFichier.mockReset()
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, blob: () => Promise.resolve(new Blob(['x'])) })
    )
    window.URL.createObjectURL = vi.fn(() => 'blob:mock')
    window.URL.revokeObjectURL = vi.fn()
  })

  it('exportPdf : POST /admin/reports/attendance avec seance_id local (#337)', async () => {
    await attendanceExportService.exportPdf(42)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://api.test/api/admin/reports/attendance',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer TEST_TOKEN',
          Accept: 'application/pdf'
        }),
        body: JSON.stringify({ seance_id: 42, format: 'pdf' }),
      })
    )
  })

  /**
   * Le serveur rend du SpreadsheetML 2003 (XML), en `application/vnd.ms-excel`,
   * nommé `presences-seance-{id}.xls` (SeanceAttendanceExportService:74-101 ; spec
   * #991). L'ancien test exigeait le type xlsx : le fichier était nommé .xlsx, une
   * archive zip que ces octets XML ne sont pas.
   */
  it('exportExcel : même pipeline, format excel, demandé et enregistré en .xls', async () => {
    await attendanceExportService.exportExcel(7)
    const [url, opts] = global.fetch.mock.calls[0]
    expect(url).toBe('http://api.test/api/admin/reports/attendance')
    expect(opts.method).toBe('POST')
    expect(opts.body).toBe(JSON.stringify({ seance_id: 7, format: 'excel' }))
    expect(opts.headers.Accept).toBe('application/vnd.ms-excel')
    expect(telechargerFichier.mock.calls[0][1]).toMatch(/^presences_seance_7_\d{4}-\d{2}-\d{2}\.xls$/)
  })

  it('exportPdf : le fichier est enregistré en .pdf', async () => {
    await attendanceExportService.exportPdf(42)
    expect(telechargerFichier.mock.calls[0][1]).toMatch(/^presences_seance_42_\d{4}-\d{2}-\d{2}\.pdf$/)
  })

  it('lève l\'erreur libellée si la réponse n\'est pas ok', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false }))
    await expect(attendanceExportService.exportPdf(1)).rejects.toThrow('Erreur lors du téléchargement du PDF')
    await expect(attendanceExportService.exportExcel(1)).rejects.toThrow('Erreur lors du téléchargement du fichier Excel')
  })
})
