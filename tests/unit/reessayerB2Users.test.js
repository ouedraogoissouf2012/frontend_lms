/**
 * Lot « Réessayer », B2 (suite) : l'écran Utilisateurs affichait un bouton « Réessayer » sous CHAQUE
 * avertissement, y compris celui du refus de droits sur la liste nominative, qui dit lui-même
 * « sans issue par un réessai » (usersNotices). Un refus de droits ne propose plus « Réessayer ».
 * Les autres avertissements (une source en échec, cause non gardée par l'écran) le gardent.
 */
import { describe, it, expect } from 'vitest'
import { buildUsersNotices, noticePeutReessayer } from '@/utils/usersNotices'

const COUNTS = { classes: 3, enseignants: 2, classesOk: 3 }

describe('noticePeutReessayer — un refus de droits ne propose pas Réessayer', () => {
  it('refus de la liste nominative (403) : pas de Réessayer', () => {
    const [refus] = buildUsersNotices({ counts: COUNTS, hasClasses: true, hasEnseignants: true, rosterForbidden: true })
    expect(refus).toMatch(/droits de consulter la liste nominative/)
    expect(noticePeutReessayer(refus)).toBe(false)
  })

  it('une source en échec ou une liste incomplète : Réessayer reste', () => {
    const notices = buildUsersNotices({
      counts: { classes: null, enseignants: null, classesOk: null },
      hasClasses: false, hasEnseignants: false, rosterForbidden: false, administrationEchec: true,
    })
    expect(notices).toHaveLength(3)
    for (const n of notices) expect(noticePeutReessayer(n)).toBe(true)
    const [partielle] = buildUsersNotices({ counts: { classes: 4, enseignants: 2, classesOk: 1 }, hasClasses: true, hasEnseignants: true, rosterForbidden: false })
    expect(noticePeutReessayer(partielle)).toBe(true)
  })
})
