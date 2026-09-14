import { beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.fn(() => Promise.resolve({}))
vi.mock('@/services/api', () => ({ default: { post: (...args) => post(...args) } }))

const { previewImport } = await import('@/services/importPreview')

/** Champs du FormData réellement envoyé, sous forme lisible. */
function champsEnvoyes() {
  const [, form] = post.mock.calls[0]

  return Object.fromEntries([...form.entries()].map(([cle, valeur]) => [
    cle,
    valeur instanceof File ? `<File:${valeur.name}>` : valeur,
  ]))
}

beforeEach(() => post.mockClear())

describe('previewImport (#334)', () => {
  const fichier = () => new File(['nom;prenom'], 'eleves.csv', { type: 'text/csv' })

  it('poste le fichier sous la cle attendue par le serveur', async () => {
    await previewImport(fichier())

    expect(post.mock.calls[0][0]).toBe('/lms/imports/preview')
    expect(champsEnvoyes()).toEqual({ file: '<File:eleves.csv>' })
  })

  it('aplatit la cartographie en mapping[champ]', async () => {
    await previewImport(fichier(), { nom: 'Nom', prenom: 'Prénom' })

    expect(champsEnvoyes()).toMatchObject({
      'mapping[nom]': 'Nom',
      'mapping[prenom]': 'Prénom',
    })
  })

  it('omet les champs de cartographie laisses vides', async () => {
    await previewImport(fichier(), { nom: 'Nom', email: '' })

    expect(champsEnvoyes()).not.toHaveProperty('mapping[email]')
  })

  it('envoie le delimiteur sous forme de NOM, jamais le caractere', async () => {
    // Une tabulation brute était élaguée par le serveur et faisait refuser la
    // requête : tout fichier tabulé devenait inimportable.
    await previewImport(fichier(), {}, '\t')

    expect(champsEnvoyes().delimiter).toBe('tab')
  })

  it('nomme aussi le point-virgule et la virgule', async () => {
    await previewImport(fichier(), {}, ';')
    expect(champsEnvoyes().delimiter).toBe('semicolon')

    post.mockClear()
    await previewImport(fichier(), {}, ',')
    expect(champsEnvoyes().delimiter).toBe('comma')
  })

  it('n envoie aucun delimiteur inconnu', async () => {
    await previewImport(fichier(), {}, '|')

    expect(champsEnvoyes()).not.toHaveProperty('delimiter')
  })

  it('laisse le navigateur poser le type multipart et sa boundary', async () => {
    await previewImport(fichier())

    expect(post.mock.calls[0][2].headers['Content-Type']).toBeNull()
  })
})
