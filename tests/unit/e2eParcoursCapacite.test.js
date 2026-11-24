/**
 * Parcours fonctionnel de la CAPACITÉ D'UNE CLASSE (#631) : ce que la relecture exige pour dire VERT. L'écran
 * RECHARGÉ dit la capacité, et `GET /classes` porte le même `effectif` (le serveur fait foi). En école KLASSCI,
 * l'écran des codes ne s'ouvre pas et aucun « Modifier la capacité » n'est offert.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DONNEES_CAPACITE, ETAPES_CAPACITE, MODIFIER, jugerCapacite, jugerFerme, libelleCapacite } from '../../e2e/parcours-capacite.mjs'
import { libelleCapacite as libelleDuFront } from '../../src/composables/useClasseCapacite.js'

const lecture = (effectif, champs = {}) => ({ statut: 200, ecran: libelleCapacite(effectif), api: { statut: 200, effectif }, ...champs })

describe('parcours-capacite — les étapes', () => {
  it('fermé (KLASSCI), régler, puis vider : vider exige que régler soit VERT ; tout par l’admin', () => {
    expect(ETAPES_CAPACITE.map((e) => [e.cle, e.compte, e.requiert])).toEqual([
      ['ferme', 'admin', []],
      ['regler', 'admin', []],
      ['vider', 'admin', ['regler']],
    ])
    expect(DONNEES_CAPACITE).toEqual({ classe: '6e A E2E', nouvelle: 25 })
  })

  it('les libellés recopiés SONT ceux du front', () => {
    for (const effectif of [null, 1, 25, 30]) expect(libelleCapacite(effectif)).toBe(libelleDuFront({ effectif }))
  })

  it('la classe visée est montée avec une capacité de 30 (l’écran la dit avant tout réglage)', () => {
    const ps1 = readFileSync(resolve(process.cwd(), 'e2e/ecole-lms.ps1'), 'utf8')
    expect(ps1).toMatch(/libelle = '6e A E2E'; code = 'E2E-6A'; effectif = 30/)
  })

  it('en école KLASSCI, régler est NON TESTÉ, déclaré ; en école autonome, « fermé » l’est', async () => {
    const regler = ETAPES_CAPACITE.find((e) => e.cle === 'regler')
    expect((await regler.action({ jeu: { ecole: 'klassci' }, donnees: DONNEES_CAPACITE, etat: {} })).nonTeste).toMatch(/vient de KLASSCI/)
    const ferme = ETAPES_CAPACITE.find((e) => e.cle === 'ferme')
    expect((await ferme.action({ jeu: { ecole: 'lms' }, donnees: DONNEES_CAPACITE, etat: {} })).nonTeste).toMatch(/école autonome/)
  })
})

describe('parcours-capacite — la relecture du réglage', () => {
  it('VERT : PUT 200, écran rechargé et API d’accord', () => {
    expect(jugerCapacite(lecture(25), 25)).toMatchObject({ confirme: true })
    expect(jugerCapacite(lecture(null), null)).toMatchObject({ confirme: true })
  })

  it('ROUGE : un PUT refusé', () => {
    expect(jugerCapacite(lecture(25, { statut: 403 }), 25).ecart).toMatch(/HTTP 403/)
  })

  it('ROUGE : l’écran rechargé dit une autre capacité, ou rien', () => {
    expect(jugerCapacite(lecture(25, { ecran: 'Capacité : 30 élèves' }), 25).ecart).toMatch(/30 élèves/)
    expect(jugerCapacite(lecture(25, { ecran: null }), 25).ecart).toMatch(/rien/)
  })

  it('ROUGE : l’API ne porte pas la valeur (un 0 n’est PAS un null)', () => {
    expect(jugerCapacite(lecture(null, { api: { statut: 200, effectif: 0 } }), null).ecart).toMatch(/effectif 0/)
    expect(jugerCapacite(lecture(25, { api: { statut: 200, effectif: 'classe absente' } }), 25).confirme).toBe(false)
    expect(jugerCapacite(lecture(25, { api: { statut: 500, effectif: 25 } }), 25).ecart).toMatch(/HTTP 500/)
  })
})

describe('parcours-capacite — l’école KLASSCI', () => {
  it('VERT : l’écran des codes ne s’ouvre pas et aucun geste n’est offert', () => {
    expect(jugerFerme({ chemin: '/admin/dashboard', gestes: 0 })).toMatchObject({ confirme: true })
  })

  it('ROUGE : l’écran des codes s’ouvre, ou un « Modifier la capacité » est offert', () => {
    expect(jugerFerme({ chemin: '/admin/enrolment-codes', gestes: 0 }).confirme).toBe(false)
    expect(jugerFerme({ chemin: '/admin/dashboard', gestes: 1 }).ecart).toContain(MODIFIER)
  })
})
