/**
 * Parcours fonctionnel des PÉRIODES ARCHIVÉES (#611) : ce que la relecture exige pour dire VERT. Archiver retire la
 * carte AUSSITÔT et après rechargement ; la liste par défaut ne porte plus la période, la liste `archivees=1` la porte
 * archivée ; cocher la case la fait revenir, « Archivée ».
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CASE, DONNEES_PERIODES, ETAPES_PERIODES, jugerArchivage, jugerRevue, ligneDe } from '../../e2e/parcours-periodes-archivees.mjs'

const P = DONNEES_PERIODES.periode
const archivage = (champs = {}) => ({
  carteAussitot: 0, carteRechargee: 0,
  defaut: { statut: 200, ligne: null }, archivees: { statut: 200, ligne: { libelle: P, status: 'archivee' } },
  ...champs,
})

describe('parcours-periodes-archivees — les étapes', () => {
  it('créer → annuler → archiver → revoir, chacune exige la précédente ; tout par l’admin', () => {
    expect(ETAPES_PERIODES.map((e) => [e.cle, e.compte, e.requiert])).toEqual([
      ['creer', 'admin', []],
      ['annuler', 'admin', ['creer']],
      ['archiver', 'admin', ['annuler']],
      ['revoir', 'admin', ['archiver']],
    ])
  })

  it('le libellé de la case EST celui de l’écran', () => {
    const vue = readFileSync(resolve(process.cwd(), 'src/views/admin/AdminTrainingSessions.vue'), 'utf8')
    expect(vue).toContain(`<label for="voir-archivees">${CASE}</label>`)
  })

  it('en école KLASSCI : NON TESTÉ déclaré dès la création (la chaîne s’arrête), jamais un vert', async () => {
    const fait = await ETAPES_PERIODES[0].action({ jeu: { ecole: 'klassci' }, donnees: DONNEES_PERIODES, etat: {} })
    expect(fait.nonTeste).toMatch(/peutGererCatalogueLocal/)
  })

  it('ligneDe lit une page de GET /training-sessions, ou rend null', () => {
    expect(ligneDe({ data: [{ libelle: 'x' }, { libelle: P, status: 'annulee' }] }, P)).toEqual({ libelle: P, status: 'annulee' })
    expect(ligneDe({ data: [] }, P)).toBeNull()
    expect(ligneDe(null, P)).toBeNull()
  })
})

describe('parcours-periodes-archivees — l’archivage relu', () => {
  it('VERT : carte retirée aussitôt et après rechargement, absente par défaut, archivée avec archivees=1', () => {
    expect(jugerArchivage(archivage())).toMatchObject({ confirme: true })
  })

  it('ROUGE : la carte reste juste après « Archiver » (le défaut de #611)', () => {
    expect(jugerArchivage(archivage({ carteAussitot: 1 })).ecart).toMatch(/juste après/)
  })

  it('ROUGE : la carte revient au rechargement, ou la liste par défaut la porte encore', () => {
    expect(jugerArchivage(archivage({ carteRechargee: 1 })).confirme).toBe(false)
    expect(jugerArchivage(archivage({ defaut: { statut: 200, ligne: { libelle: P, status: 'archivee' } } })).ecart).toMatch(/par défaut/)
  })

  it('ROUGE : la liste archivees=1 ne la porte pas, ou pas archivée', () => {
    expect(jugerArchivage(archivage({ archivees: { statut: 200, ligne: null } })).ecart).toMatch(/aucune ligne/)
    expect(jugerArchivage(archivage({ archivees: { statut: 200, ligne: { status: 'annulee' } } })).ecart).toMatch(/annulee/)
    expect(jugerArchivage(archivage({ archivees: { statut: 422, ligne: null } })).ecart).toMatch(/422/)
  })
})

describe('parcours-periodes-archivees — la période revue', () => {
  it('VERT : case cochée, carte présente et « Archivée »', () => {
    expect(jugerRevue({ coche: true, carte: `${P}\nArchivée · À venir` })).toMatchObject({ confirme: true })
  })

  it('ROUGE : case non cochée, carte absente, ou carte sans « Archivée »', () => {
    expect(jugerRevue({ coche: false, carte: 'Archivée' }).confirme).toBe(false)
    expect(jugerRevue({ coche: true, carte: null }).ecart).toMatch(/n’apparaît pas/)
    expect(jugerRevue({ coche: true, carte: `${P}\nAnnulée` }).ecart).toMatch(/ne dit pas/)
  })
})
