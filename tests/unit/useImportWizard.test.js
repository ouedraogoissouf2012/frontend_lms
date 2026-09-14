import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IMPORT_FIELDS, MAX_IMPORT_BYTES } from '@/constants/importFields'

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

/**
 * Vrai `File`, et non un objet simple : Vue ne proxifie pas un File, donc
 * l'identité de l'objet envoyé est observable — c'est justement ce qu'un des
 * tests vérifie (le fichier n'est plus reconstruit).
 */
function fileFrom(content, { name = 'eleves.csv', size = null } = {}) {
  const bytes = content instanceof Uint8Array ? content : new TextEncoder().encode(content)
  const file = new File([bytes], name, { type: 'text/csv' })
  if (size !== null) Object.defineProperty(file, 'size', { value: size })

  return file
}

async function atMapping(content, options) {
  const wizard = useImportWizard()
  wizard.chooseFile(fileFrom(content, options))
  await wizard.readHeaders()

  return wizard
}

beforeEach(() => {
  previewImport.mockReset()
  confirmImport.mockReset()
  getImport.mockReset()
  previewImport.mockResolvedValue({ rows: [], counts: { ok: 0, error: 0, total: 0 } })
  confirmImport.mockResolvedValue({ data: { import_id: 9, status: 'queued' } })
  getImport.mockResolvedValue({
    data: { import_id: 9, status: 'queued', counts: { ok: 1, error: 0 }, rows: [] },
  })
  localStorage.clear()
})

describe('useImportWizard (#334) — lecture des colonnes', () => {
  it('lit les en-tetes sans perdre la colonne vide du milieu', async () => {
    const wizard = await atMapping('nom;;prenom\nDoe;X;Jane')

    expect(wizard.headers.value).toEqual(['nom', '', 'prenom'])
    expect(wizard.step.value).toBe(2)
  })

  it('lit un export Windows-1252 sans fabriquer de caractere de remplacement', async () => {
    // « Prénom » en cp1252 : é = 0xE9.
    const bytes = new Uint8Array([0x4e, 0x6f, 0x6d, 0x3b, 0x50, 0x72, 0xe9, 0x6e, 0x6f, 0x6d])
    const wizard = await atMapping(bytes)

    expect(wizard.headers.value).toEqual(['Nom', 'Prénom'])
    expect(wizard.headers.value.join()).not.toContain('�')
  })

  it('lit l en-tete d un gros fichier meme si la tranche coupe un accent en deux', async () => {
    // On ne lit qu'un début de fichier. La coupure tombe fatalement un jour au
    // milieu d'un caractère multi-octets : l'en-tête, lui, reste valide et doit
    // s'afficher tel quel — pas en mojibake.
    const entete = 'Nom;Prénom;Courriel\n'
    const octetsEntete = new TextEncoder().encode(entete).byteLength
    // Décale le corps pour que l'octet 65 536 tombe au MILIEU d'un « é ».
    const bourrage = 'a'.repeat((65536 - octetsEntete) % 2 === 0 ? 1 : 0)
    const contenu = `${entete}${bourrage}${'é'.repeat(40000)}`
    const wizard = await atMapping(contenu)

    expect(wizard.headers.value).toEqual(['Nom', 'Prénom', 'Courriel'])
    expect(wizard.mapping.value).toEqual({ nom: 'Nom', prenom: 'Prénom', email: 'Courriel' })
  })

  it('preremplit la cartographie malgre accents et casse', async () => {
    const wizard = await atMapping('Nom;Prénom;Courriel\nDoe;Jane;j@t.co')

    expect(wizard.mapping.value).toEqual({ nom: 'Nom', prenom: 'Prénom', email: 'Courriel' })
  })

  it('refuse un fichier sans aucune colonne et reste a l etape 1', async () => {
    const wizard = await atMapping('')

    expect(wizard.step.value).toBe(1)
    expect(wizard.error.value).not.toBe('')
  })

  it('signale une lecture impossible au lieu de rejeter en silence', async () => {
    const wizard = useImportWizard()
    wizard.chooseFile({
      name: 'k.csv',
      size: 10,
      slice: () => ({ arrayBuffer: async () => { throw new Error('EACCES') } }),
    })

    await expect(wizard.readHeaders()).resolves.toBeUndefined()
    expect(wizard.error.value).not.toBe('')
    expect(wizard.step.value).toBe(1)
  })

  it('refuse un fichier plus gros que ce que le serveur accepte', async () => {
    const wizard = useImportWizard()
    wizard.chooseFile(fileFrom('nom;prenom', { size: MAX_IMPORT_BYTES + 1 }))

    expect(wizard.error.value).not.toBe('')
    expect(wizard.file.value).toBeNull()
  })

  it('n attribue pas les colonnes d un fichier a celui choisi entre-temps', async () => {
    // La lecture est asynchrone : si l'utilisateur change de fichier pendant
    // ce temps, les en-têtes de l'ancien ne doivent pas s'afficher comme
    // étant ceux du nouveau.
    const wizard = useImportWizard()
    wizard.chooseFile(fileFrom('ancien;colonnes\n1;2'))
    const lecture = wizard.readHeaders()
    wizard.chooseFile(fileFrom('nouveau;fichier\n3;4'))
    await lecture

    expect(wizard.headers.value).toEqual([])
    expect(wizard.step.value).toBe(1)
  })

  it('efface une erreur de lecture des que la lecture suivante reussit', async () => {
    const wizard = useImportWizard()
    wizard.chooseFile({
      name: 'k.csv',
      size: 10,
      slice: () => ({ arrayBuffer: async () => { throw new Error('EACCES') } }),
    })
    await wizard.readHeaders()
    expect(wizard.error.value).not.toBe('')

    wizard.file.value = fileFrom('nom;prenom\nDoe;Jane')
    await wizard.readHeaders()

    expect(wizard.error.value).toBe('')
    expect(wizard.step.value).toBe(2)
  })

  it('oublie les colonnes du fichier precedent quand on en choisit un autre', async () => {
    const wizard = await atMapping('nom;prenom\nDoe;Jane')
    expect(wizard.headers.value).toHaveLength(2)

    wizard.chooseFile(fileFrom('autre;colonnes;ici'))

    expect(wizard.headers.value).toEqual([])
    expect(wizard.mapping.value).toEqual({})
    expect(wizard.step.value).toBe(1)
  })
})

describe('useImportWizard (#334) — garde avant analyse', () => {
  it('bloque tant qu un champ requis manque', async () => {
    const wizard = await atMapping('colonneA;colonneB\n1;2')

    expect(wizard.mappingComplete.value).toBe(false)
    expect(wizard.mappingIssues.value).toHaveLength(1)
  })

  it('bloque sans courriel ni telephone, ce que le serveur refuserait ligne a ligne', async () => {
    const wizard = await atMapping('Nom;Prenom\nDoe;Jane')
    wizard.mapping.value = { nom: 'Nom', prenom: 'Prenom' }

    expect(wizard.mappingComplete.value).toBe(false)
    expect(wizard.mappingIssues.value[0]).toMatch(/courriel|téléphone/i)
  })

  it('laisse passer des que nom, prenom et un contact sont branches', async () => {
    const wizard = await atMapping('Nom;Prenom;Tel\nDoe;Jane;70')
    wizard.mapping.value = { nom: 'Nom', prenom: 'Prenom', telephone: 'Tel' }

    expect(wizard.mappingComplete.value).toBe(true)
    expect(wizard.mappingIssues.value).toEqual([])
  })

  it('n envoie rien quand la cartographie est incomplete', async () => {
    const wizard = await atMapping('Nom;Prenom\nDoe;Jane')
    wizard.mapping.value = { nom: 'Nom' }

    await wizard.runPreview()

    expect(previewImport).not.toHaveBeenCalled()
    expect(wizard.step.value).toBe(2)
  })
})

describe('useImportWizard (#334) — envoi', () => {
  it('envoie le fichier INTACT, la cartographie et le delimiteur', async () => {
    const original = fileFrom('Nom,Prenom,Tel\n"Doe; fils",Jane,70000000')
    const wizard = useImportWizard()
    wizard.chooseFile(original)
    await wizard.readHeaders()
    wizard.mapping.value = { nom: 'Nom', prenom: 'Prenom', telephone: 'Tel' }

    await wizard.runPreview()

    expect(previewImport).toHaveBeenCalledTimes(1)
    const [sent, mapping, delimiter] = previewImport.mock.calls[0]
    // Le fichier n'est plus reconstruit : c'est l'objet d'origine qui part.
    expect(sent).toBe(original)
    expect(mapping).toEqual({ nom: 'Nom', prenom: 'Prenom', telephone: 'Tel' })
    expect(delimiter).toBe(',')
  })

  it('lit le rapport sous l enveloppe du serveur', async () => {
    previewImport.mockResolvedValue({
      success: true,
      data: { rows: [{ line: 2, status: 'ok' }], counts: { ok: 1, error: 0, total: 1 } },
    })
    const wizard = await atMapping('Nom;Prenom;Tel\nDoe;Jane;70')
    wizard.mapping.value = { nom: 'Nom', prenom: 'Prenom', telephone: 'Tel' }

    await wizard.runPreview()

    expect(wizard.report.value.counts.ok).toBe(1)
    expect(wizard.step.value).toBe(3)
  })

  it('refuse une reponse de forme inattendue au lieu d afficher un zero fabrique', async () => {
    // « 0 accepte, 0 refuse » sur une reponse illisible se lit comme un feu
    // vert : mieux vaut dire que l'analyse n'a pas abouti.
    previewImport.mockResolvedValue({ success: true, data: null })
    const wizard = await atMapping('Nom;Prenom;Tel\nDoe;Jane;70')
    wizard.mapping.value = { nom: 'Nom', prenom: 'Prenom', telephone: 'Tel' }

    await wizard.runPreview()

    expect(wizard.report.value).toBeNull()
    expect(wizard.step.value).toBe(2)
    expect(wizard.error.value).not.toBe('')
  })

  it('refuse de presenter un rapport ou aucune ligne n a ete lue', async () => {
    // Cas réel mesuré : un « CSV Macintosh » fait lire au serveur sept en-têtes
    // et aucune ligne. Le rapport revient à zéro partout — ce n'est pas « aucune
    // erreur », c'est « rien n'a été lu ».
    previewImport.mockResolvedValue({ rows: [], counts: { ok: 0, error: 0, total: 0 } })
    const wizard = await atMapping('Nom;Prenom;Tel\nDoe;Jane;70')
    wizard.mapping.value = { nom: 'Nom', prenom: 'Prenom', telephone: 'Tel' }

    await wizard.runPreview()

    expect(wizard.report.value).toBeNull()
    expect(wizard.step.value).toBe(2)
    expect(wizard.error.value).toMatch(/aucune ligne/i)
  })

  it('relaie le message du serveur en cas d echec', async () => {
    previewImport.mockRejectedValue({ userMessage: 'Deux colonnes portent le même nom.' })
    const wizard = await atMapping('Nom;Prenom;Tel\nDoe;Jane;70')
    wizard.mapping.value = { nom: 'Nom', prenom: 'Prenom', telephone: 'Tel' }

    await wizard.runPreview()

    expect(wizard.error.value).toBe('Deux colonnes portent le même nom.')
    expect(wizard.loading.value).toBe(false)
    expect(wizard.step.value).toBe(2)
  })

  it('n envoie pas deux fois si l analyse est deja en cours', async () => {
    let resolve
    previewImport.mockReturnValue(new Promise((r) => { resolve = r }))
    const wizard = await atMapping('Nom;Prenom;Tel\nDoe;Jane;70')
    wizard.mapping.value = { nom: 'Nom', prenom: 'Prenom', telephone: 'Tel' }

    const first = wizard.runPreview()
    await wizard.runPreview()
    resolve({ rows: [], counts: { ok: 0, error: 0, total: 0 } })
    await first

    expect(previewImport).toHaveBeenCalledTimes(1)
  })
})

describe('useImportWizard (#334) — confirmation et rapport', () => {
  async function atPreview() {
    previewImport.mockResolvedValue({
      data: {
        import_id: 9,
        rows: [{ line: 2, status: 'ok', message: null }],
        counts: { ok: 1, error: 0, total: 1 },
      },
    })
    const wizard = await atMapping('Nom;Prenom;Tel\nDoe;Jane;70')
    wizard.mapping.value = { nom: 'Nom', prenom: 'Prenom', telephone: 'Tel' }
    await wizard.runPreview()

    return wizard
  }

  it('n confirme pas sans identifiant d import', async () => {
    const wizard = await atMapping('Nom;Prenom;Tel\nDoe;Jane;70')
    wizard.report.value = { counts: { ok: 1, error: 0, total: 1 }, rows: [] }

    await wizard.confirmJob()

    expect(confirmImport).not.toHaveBeenCalled()
    expect(wizard.step.value).toBe(2)
  })

  it('passe a l ecran 4 et persiste l identifiant', async () => {
    const wizard = await atPreview()

    await wizard.confirmJob()

    expect(confirmImport).toHaveBeenCalledWith(9)
    expect(wizard.step.value).toBe(4)
    expect(JSON.parse(localStorage.getItem('import_job_test')).importId).toBe(9)
    wizard.stopJob()
  })

  it('retrouve le rapport apres reconnexion', async () => {
    localStorage.setItem('import_job_test', JSON.stringify({ importId: 9 }))
    getImport.mockResolvedValue({
      data: {
        import_id: 9,
        status: 'done',
        counts: { ok: 1, error: 0 },
        rows: [{ line: 2, status: 'ok', message: 'téléphone déjà utilisé par Awa Traoré' }],
      },
    })
    const wizard = useImportWizard()

    await wizard.restoreJob()

    expect(wizard.step.value).toBe(4)
    expect(wizard.jobStatus.value).toBe('done')
    expect(wizard.jobReport.value.rows[0].message).toContain('Awa Traoré')
  })

  it('un 404 apres reconnexion ne se fait pas passer pour un succes', async () => {
    localStorage.setItem('import_job_test', JSON.stringify({ importId: 9 }))
    getImport.mockRejectedValue({ response: { status: 404 } })
    const wizard = useImportWizard()

    await wizard.restoreJob()

    expect(wizard.step.value).toBe(1)
    expect(localStorage.getItem('import_job_test')).toBeNull()
  })

  it('relaie l echec de confirmation', async () => {
    confirmImport.mockRejectedValue({ userMessage: 'Import non confirmable' })
    const wizard = await atPreview()

    await wizard.confirmJob()

    expect(wizard.step.value).toBe(3)
    expect(wizard.error.value).toBe('Import non confirmable')
    expect(wizard.loading.value).toBe(false)
  })
})

describe('IMPORT_FIELDS', () => {
  it('n exige separement ni le courriel ni le telephone', () => {
    const optionnels = IMPORT_FIELDS.filter((field) => ['email', 'telephone'].includes(field.key))

    expect(optionnels).toHaveLength(2)
    expect(optionnels.every((field) => !field.required)).toBe(true)
  })
})
