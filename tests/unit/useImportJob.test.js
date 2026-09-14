import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const confirmImport = vi.fn()
const getImport = vi.fn()
const downloadBlob = vi.fn()
vi.mock('@/services/importJob', () => ({
  confirmImport: (...args) => confirmImport(...args),
  getImport: (...args) => getImport(...args),
}))
vi.mock('@/services/cache', () => ({
  cacheKey: (name) => `${name}_test`,
}))
vi.mock('@/utils/downloadBlob', () => ({
  downloadBlob: (...args) => downloadBlob(...args),
}))

const { useImportJob } = await import('@/composables/useImportJob')

beforeEach(() => {
  confirmImport.mockReset()
  getImport.mockReset()
  downloadBlob.mockReset()
  localStorage.clear()
  confirmImport.mockResolvedValue({ data: { import_id: 9, status: 'queued' } })
  getImport.mockResolvedValue({
    data: { import_id: 9, status: 'queued', counts: { ok: 1, error: 0 }, rows: [] },
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useImportJob (#334)', () => {
  it('poll jusqu au statut terminal puis s arrete', async () => {
    vi.useFakeTimers()
    getImport
      .mockResolvedValueOnce({
        data: { import_id: 9, status: 'queued', counts: { ok: 1, error: 0 }, rows: [] },
      })
      .mockResolvedValueOnce({
        data: {
          import_id: 9,
          status: 'done',
          counts: { ok: 1, error: 0 },
          rows: [{ line: 2, status: 'ok', message: null }],
        },
      })
    const job = useImportJob()

    await job.confirm(9, { counts: { ok: 1, error: 0 }, rows: [] })
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(2000)

    expect(job.status.value).toBe('done')
    expect(job.polling.value).toBe(false)
    expect(getImport).toHaveBeenCalledTimes(2)
    job.stop()
  })

  it('n exporte rien tant que le rapport n a pas de lignes', () => {
    const job = useImportJob()
    job.exportCsv()
    expect(downloadBlob).not.toHaveBeenCalled()
  })

  it('exporte le csv du rapport', async () => {
    getImport.mockResolvedValue({
      data: {
        import_id: 9,
        status: 'done',
        counts: { ok: 0, error: 1 },
        rows: [{ line: 3, status: 'error', message: 'Nom et prénom requis.' }],
      },
    })
    localStorage.setItem('import_job_test', JSON.stringify({ importId: 9 }))
    const job = useImportJob()
    await job.restore()

    job.exportCsv()

    expect(downloadBlob).toHaveBeenCalledTimes(1)
    const [blob, name] = downloadBlob.mock.calls[0]
    expect(name).toBe('rapport-import-apprenants.csv')
    expect(await blob.text()).toContain('Nom et prénom requis.')
  })
})
