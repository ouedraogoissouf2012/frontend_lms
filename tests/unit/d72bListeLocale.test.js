/**
 * D72-b, volet 1 : la liste de l'enseignant part de la programmation KLASSCI, à laquelle elle accroche les
 * versions en ligne par `klassci_evaluation_id`. Une évaluation créée dans une école LMS n'a PAS d'id
 * KLASSCI : elle n'apparaissait jamais. Elle devient sa propre carte, sa version en ligne étant elle-même.
 * Chaque carte porte une clé de FAMILLE (`klassci-<id>` / `lms-<id>`) : les deux espaces d'ids peuvent
 * se recouvrir, la clé de liste ne le doit pas.
 */
import { describe, it, expect } from 'vitest'
import { mergeWithOnlineVersions } from '@/utils/evaluations'

const KLASSCI = [{ id: 5, titre: 'Programmée' }]
const EN_LIGNE = { id: 50, klassci_evaluation_id: 5, titre: 'Programmée' }
const LOCALE = { id: 5, klassci_evaluation_id: null, classe_id: 9, matiere_id: 3, titre: 'Locale', status: 'planifiee' }

describe('mergeWithOnlineVersions — les évaluations locales ont leur carte', () => {
  it('KLASSCI : sa version en ligne lui est accrochée, comme avant', () => {
    const [carte] = mergeWithOnlineVersions(KLASSCI, [EN_LIGNE])
    expect(carte.online_version).toBe(EN_LIGNE)
    expect(carte.has_online).toBe(true)
  })

  it('une évaluation LMS sans klassci_evaluation_id devient une carte, version en ligne = elle-même', () => {
    const cartes = mergeWithOnlineVersions(KLASSCI, [EN_LIGNE, LOCALE])
    expect(cartes).toHaveLength(2)
    const locale = cartes.find((c) => c.titre === 'Locale')
    expect(locale.online_version).toBe(LOCALE)
    expect(locale.has_online).toBe(true)
  })

  it('aucune programmation KLASSCI (école LMS) : la liste est celle des évaluations locales', () => {
    expect(mergeWithOnlineVersions([], [LOCALE]).map((c) => c.titre)).toEqual(['Locale'])
  })

  it('une clé de famille unique, même si les ids se recouvrent (KLASSCI 5, LMS 5)', () => {
    const cles = mergeWithOnlineVersions(KLASSCI, [EN_LIGNE, LOCALE]).map((c) => c.cle)
    expect(cles).toEqual(['klassci-5', 'lms-5'])
  })

  it('une version en ligne d’une évaluation KLASSCI n’est jamais dupliquée en carte locale', () => {
    expect(mergeWithOnlineVersions(KLASSCI, [EN_LIGNE])).toHaveLength(1)
  })
})
