/**
 * La garde des fixtures KLASSCI doit ROUGIR — c'est ce que ce fichier prouve.
 *
 * Le dépôt a déjà payé la garde qui ne peut pas échouer : `check-file-sizes.php`
 * et son jumeau affichaient « ✓ … respectent la limite » **sans avoir inspecté
 * un seul fichier** (#701). Aggravant, un test entérinait ce comportement.
 *
 * On écrit donc d'abord le test qui prouve que la garde attrape, puis celui qui
 * prouve qu'elle laisse passer ce qu'elle doit laisser passer. Une garde qui ne
 * rougit jamais ne surveille rien — comme une garde toujours rouge.
 */
import { describe, it, expect } from 'vitest'
import {
  construireBaseline,
  inspecter,
  nouvelles,
  total,
} from '../../scripts/lib/klassciFixtureRatchet.mjs'

/** Le défaut réel : la fixture inventée de `useTeacherStats.test.js`. */
const TEST_AVEC_CHARGE_INVENTEE = `
import { vi } from 'vitest'
vi.mock('@/services/klassci', () => ({ klassciService: { getTeacherDashboard: vi.fn() } }))

const DASHBOARD = {
  matieres: [{ id: 1, nom: 'Maths' }],
  places_occupees: 30,
  statistiques: { heures: { total_seances: 12 } },
}
`

/** Le même test, une fois conforme. */
const TEST_CONFORME = `
import { vi } from 'vitest'
import { TEACHER_DASHBOARD } from '../fixtures/klassci/teacherDashboard'
vi.mock('@/services/klassci', () => ({ klassciService: { getTeacherDashboard: vi.fn() } }))

const DASHBOARD = TEACHER_DASHBOARD
`

describe('garde des fixtures KLASSCI — elle rougit', () => {
  it('attrape une charge KLASSCI ecrite a la main', () => {
    const v = inspecter('tests/unit/exemple.test.js', TEST_AVEC_CHARGE_INVENTEE)

    expect(v.length).toBeGreaterThan(0)
    expect(v.map((x) => x.marqueur)).toEqual(
      expect.arrayContaining(['places_occupees', 'statistiques.heures']),
    )
  })

  it('signale la LIGNE, pour qu’on sache quoi corriger', () => {
    const v = inspecter('tests/unit/exemple.test.js', TEST_AVEC_CHARGE_INVENTEE)

    for (const violation of v) {
      expect(violation.line).toBeGreaterThan(0)
      expect(violation.extrait).not.toBe('')
    }
  })
})

describe('garde des fixtures KLASSCI — elle laisse passer ce qui est legitime', () => {
  it('ne dit rien d’un test qui importe les fixtures capturees', () => {
    expect(inspecter('tests/unit/exemple.test.js', TEST_CONFORME)).toEqual([])
  })

  it('ne dit rien d’un test qui ne consomme pas KLASSCI', () => {
    // Les mêmes clés, mais aucun service KLASSCI en vue : hors périmètre.
    const sansKlassci = `const x = { places_occupees: 30, combinaisons: [] }`

    expect(inspecter('tests/unit/exemple.test.js', sansKlassci)).toEqual([])
  })

  it('ne confond pas un COMMENTAIRE avec une charge', () => {
    const commente = `
      import { vi } from 'vitest'
      vi.mock('@/services/klassci', () => ({}))
      // statistiques: { heures: { total_seances: 105 } } — forme réelle, documentée ici
      const x = 1
    `

    expect(inspecter('tests/unit/exemple.test.js', commente)).toEqual([])
  })

  it('ne confond pas `statistiques` seul avec la forme KLASSCI', () => {
    // Le mot est trop courant pour être un marqueur : seule l'imbrication
    // `statistiques: { heures` identifie la charge amont.
    const autre = `
      import { klassciService } from '@/services/klassci'
      const local = { statistiques: { lecons: 4 } }
    `

    expect(inspecter('tests/unit/exemple.test.js', autre)).toEqual([])
  })
})

describe('le cliquet ne peut que se resserrer', () => {
  const violations = inspecter('tests/unit/exemple.test.js', TEST_AVEC_CHARGE_INVENTEE)

  it('la dette existante est gelee, pas signalee', () => {
    const baseline = construireBaseline(violations)

    expect(nouvelles(violations, baseline)).toEqual([])
    expect(total(baseline)).toBe(violations.length)
  })

  it('une charge SUPPLEMENTAIRE dans un fichier deja gele rougit', () => {
    const baseline = construireBaseline(violations)
    const uneDeplus = [...violations, { ...violations[0], line: 999 }]

    expect(nouvelles(uneDeplus, baseline)).toHaveLength(1)
  })

  it('un fichier NEUF rougit entierement', () => {
    const baseline = construireBaseline(violations)
    const ailleurs = inspecter('tests/unit/neuf.test.js', TEST_AVEC_CHARGE_INVENTEE)

    expect(nouvelles(ailleurs, baseline)).toHaveLength(ailleurs.length)
  })

  it('DEPLACER une fixture existante ne rougit pas', () => {
    // Le cliquet gèle un compte, pas des numéros de ligne : un simple
    // reformatage ne doit pas faire échouer la CI.
    const baseline = construireBaseline(violations)
    const deplacees = violations.map((v) => ({ ...v, line: v.line + 40 }))

    expect(nouvelles(deplacees, baseline)).toEqual([])
  })
})
