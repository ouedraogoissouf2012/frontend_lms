/**
 * Outil E2E (D625), deux corrections de mesure révélées par l'outil honnête (#558, run 43714135376) :
 * 1. L'élève INACTIF n'a aucun accès (décision du user, D57). Ses 7 écrans qui affichent ce refus sont des refus
 *    ATTENDUS, déclarés comme REFUS_SERVEUR, comptés VERT « refus tenu » avec le motif affiché ; un refus attendu
 *    que l'écran ne dit pas est ROUGE.
 * 2. Une école KLASSCI n'a aucune classe LOCALE : `/classes/local/:id` n'y a pas de sujet. Le parcours lui donnait
 *    l'id KLASSCI d'une classe (404 juste) ; la case est NON TESTÉ, « aucune classe locale dans une école KLASSCI ».
 */
import { describe, it, expect } from 'vitest'
import { REFUS_ATTENDUS, refusAttendu, nonApplicable } from '../../e2e/acces.mjs'

const ECRANS_INACTIF = ['/student/dashboard', '/student/lessons/:id', '/lessons/:id', '/matieres/:id', '/classes/:id', '/classes/local/:id', '/seances/:id']

describe('acces.mjs — les refus attendus de l’élève inactif (D57, D625)', () => {
  it('les 7 écrans de l’élève inactif sont déclarés, avec leur règle', () => {
    expect(REFUS_ATTENDUS.map((r) => r.chemin).sort()).toEqual([...ECRANS_INACTIF].sort())
    for (const chemin of ECRANS_INACTIF) expect(refusAttendu('etudiant_inactif', { chemin })).toMatchObject({ regle: expect.stringContaining('D57') })
    expect(Object.isFrozen(REFUS_ATTENDUS)).toBe(true)
  })

  it('l’élève ACTIF n’a aucun de ces refus', () => {
    for (const chemin of ECRANS_INACTIF) expect(refusAttendu('etudiant', { chemin })).toBeNull()
  })
})

describe('acces.mjs — un écran sans sujet dans cette école (D625)', () => {
  it('une classe locale dans une école KLASSCI : non applicable, nommé', () => {
    expect(nonApplicable({ chemin: '/classes/local/:id' }, { ecole: 'klassci' })).toBe('aucune classe locale dans une école KLASSCI')
  })

  it('la même route dans l’école LMS, ou une autre route : applicable (null)', () => {
    expect(nonApplicable({ chemin: '/classes/local/:id' }, { ecole: undefined })).toBeNull()
    expect(nonApplicable({ chemin: '/classes/:id' }, { ecole: 'klassci' })).toBeNull()
  })
})
