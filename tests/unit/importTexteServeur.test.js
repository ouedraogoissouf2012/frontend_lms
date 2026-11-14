/**
 * D0 : l'import d'apprenants ne montre jamais le texte du serveur quand l'erreur n'a pas de message du
 * catalogue (`userMessage`). Le message d'une erreur HTTP est sa catégorie ; sinon le repli du front.
 * (Fichier à part : useImportWizard.test.js dépasse déjà 300 lignes.)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const previewImport = vi.fn()
const confirmImport = vi.fn()
const getImport = vi.fn()
vi.mock('@/services/importPreview', () => ({
  previewImport: (...args) => previewImport(...args),
}))
vi.mock('@/services/importJob', () => ({
  confirmImport: (...args) => confirmImport(...args),
  getImport: (...args) => getImport(...args),
}))
vi.mock('@/services/cache', () => ({
  cacheKey: (name) => `${name}_test`,
}))

const { useImportWizard } = await import('@/composables/useImportWizard')
const { useImportJob } = await import('@/composables/useImportJob')

const TEXTE_SERVEUR = 'SQLSTATE[42S22]: Column not found: 1054'
const panne = () => ({ response: { status: 500, data: { success: false, message: TEXTE_SERVEUR } } })

async function auMapping() {
  const wizard = useImportWizard()
  wizard.chooseFile(new File([new TextEncoder().encode('Nom;Prenom;Tel\nDoe;Jane;70')], 'eleves.csv', { type: 'text/csv' }))
  await wizard.readHeaders()
  wizard.mapping.value = { nom: 'Nom', prenom: 'Prenom', telephone: 'Tel' }
  return wizard
}

beforeEach(() => {
  previewImport.mockReset()
  confirmImport.mockReset()
  getImport.mockReset()
  localStorage.clear()
})

describe('import d’apprenants — jamais le texte du serveur (D0)', () => {
  it('analyse en échec : la catégorie de l’erreur', async () => {
    previewImport.mockRejectedValue(panne())
    const wizard = await auMapping()
    await wizard.runPreview()
    expect(wizard.error.value).toBe(ERROR_MESSAGES.server)
  })

  it('confirmation en échec : la catégorie de l’erreur', async () => {
    previewImport.mockResolvedValue({
      data: { import_id: 9, rows: [{ line: 2, status: 'ok', message: null }], counts: { ok: 1, error: 0, total: 1 } },
    })
    const wizard = await auMapping()
    await wizard.runPreview()
    confirmImport.mockRejectedValue(panne())
    await wizard.confirmJob()
    expect(wizard.error.value).toBe(ERROR_MESSAGES.server)
  })

  it('lecture du rapport en échec : la catégorie de l’erreur', async () => {
    confirmImport.mockResolvedValue({ data: { import_id: 9, status: 'queued' } })
    getImport.mockRejectedValue(panne())
    const job = useImportJob()
    await job.confirm(9, { counts: { ok: 1, error: 0 }, rows: [] })
    await vi.waitFor(() => expect(job.error.value).toBe(ERROR_MESSAGES.server))
    job.stop()
  })
})
