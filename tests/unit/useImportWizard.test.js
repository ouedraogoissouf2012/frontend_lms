import { describe, expect, it } from 'vitest'
import { IMPORT_FIELDS } from '@/constants/importFields'
import { useImportWizard } from '@/composables/useImportWizard'

describe('useImportWizard (#334)', () => {
  it('blocks preview until required columns are mapped', () => {
    const wizard = useImportWizard()
    expect(wizard.mappingComplete.value).toBe(false)
    wizard.mapping.value = { nom: 'Nom', prenom: 'Prenom' }
    expect(wizard.mappingComplete.value).toBe(true)
  })

  it('lists the canonical fields including optional email', () => {
    expect(IMPORT_FIELDS.some((field) => field.key === 'email' && !field.required)).toBe(true)
  })
})
