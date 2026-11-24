/**
 * Parcours fonctionnel « CRÉER UNE SESSION ET LA PUBLIER » (#606) : ce que la relecture exige pour dire VERT. La carte dit
 * le statut et « Formation : <titre> » ; `GET /training-sessions` porte le même statut et `program.titre`. La création
 * passe par le CHOIX de la formation dans la liste (e2e/gestes-sessions.mjs), comme le parcours des périodes archivées.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DONNEES_PUBLICATION, ETAPES_PUBLICATION, demain, jugerSession, ligneDe } from '../../e2e/parcours-publier-session.mjs'

const D = DONNEES_PUBLICATION
const BROUILLON = { statut: 'brouillon', libelleStatut: 'Brouillon', programme: D.programme }
const lecture = (champs = {}) => ({
  carte: `${D.session}\nBrouillon · À venir\nFormation : ${D.programme}`,
  api: { statut: 200, ligne: { libelle: D.session, status: 'brouillon', program: { id: 3, titre: D.programme } } },
  ...champs,
})

describe('parcours-publier-session — les étapes', () => {
  it('créer, puis publier (qui exige la création) ; tout par l’admin', () => {
    expect(ETAPES_PUBLICATION.map((e) => [e.cle, e.compte, e.requiert])).toEqual([['creer', 'admin', []], ['publier', 'admin', ['creer']]])
  })

  it('en école KLASSCI : NON TESTÉ déclaré', async () => {
    expect((await ETAPES_PUBLICATION[0].action({ jeu: { ecole: 'klassci' }, donnees: D, etat: {} })).nonTeste).toMatch(/peutGererCatalogueLocal/)
  })

  it('la date de début est le lendemain, au format des champs date', () => {
    expect(demain(new Date('2026-11-23T10:00:00Z'))).toBe('2026-11-24')
  })

  it('les deux parcours de l’écran CHOISISSENT la formation dans la liste, par le même geste', () => {
    for (const f of ['e2e/parcours-publier-session.mjs', 'e2e/parcours-periodes-archivees.mjs']) {
      const src = readFileSync(resolve(process.cwd(), f), 'utf8')
      expect(src).toContain("import { creerProgrammeEtSession } from './gestes-sessions.mjs'")
      expect(src).not.toContain('#program_id')
    }
    expect(readFileSync(resolve(process.cwd(), 'e2e/gestes-sessions.mjs'), 'utf8')).toContain('selectOption({ label: programme })')
  })

  it('ligneDe lit une page de GET /training-sessions, ou rend null', () => {
    expect(ligneDe({ data: [{ libelle: D.session, status: 'publiee' }] }, D.session)).toMatchObject({ status: 'publiee' })
    expect(ligneDe(null, D.session)).toBeNull()
  })
})

describe('parcours-publier-session — la relecture', () => {
  it('VERT : la carte et l’API disent le statut et la formation', () => {
    expect(jugerSession(lecture(), BROUILLON)).toMatchObject({ confirme: true })
  })

  it('ROUGE : la carte absente, sans sa formation, ou sans le statut', () => {
    expect(jugerSession(lecture({ carte: null }), BROUILLON).ecart).toMatch(/n’apparaît pas/)
    expect(jugerSession(lecture({ carte: `${D.session}\nBrouillon\nProgramme n° 3` }), BROUILLON).ecart).toMatch(/Formation/)
    expect(jugerSession(lecture({ carte: `${D.session}\nFormation : ${D.programme}` }), BROUILLON).ecart).toMatch(/Brouillon/)
  })

  it('ROUGE : l’API ne porte pas le statut, ou pas le titre de la formation', () => {
    expect(jugerSession(lecture({ api: { statut: 200, ligne: { status: 'publiee', program: { titre: D.programme } } } }), BROUILLON).ecart).toMatch(/publiee/)
    expect(jugerSession(lecture({ api: { statut: 200, ligne: { status: 'brouillon', program: null } } }), BROUILLON).ecart).toMatch(/program\.titre/)
    expect(jugerSession(lecture({ api: { statut: 403, ligne: null } }), BROUILLON).ecart).toMatch(/403/)
  })
})
