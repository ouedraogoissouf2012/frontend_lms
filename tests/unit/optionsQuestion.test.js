/**
 * B7 (#1059) : des options d'une question à choix enregistrées AVANT #1059 peuvent ne pas être des
 * textes (nombre, booléen, null, objet, liste, voire un objet associatif à la place de la liste).
 * L'éditeur les lit par une seule fonction pure, au chargement, pour les options ET les bonnes
 * réponses (comparées par valeur aux options). Aucun texte fabriqué, aucune suppression muette.
 */
import { describe, it, expect } from 'vitest'
import { lireOptionsQuestion, optionsRessaisies } from '@/utils/optionsQuestion'
// D466 (migration déclarée) : la bonne réponse se lit en POSITION (`correctes`), et une bonne
// réponse absente des options est marquée (`bonneReponseOrpheline`), jamais jetée en silence.
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const VIDES = ['', '', '', '']

describe('lireOptionsQuestion (B7)', () => {
  it('une liste de textes reste identique', () => {
    expect(lireOptionsQuestion({ type: 'qcm', options: ['A', 'B'], correct_answers: ['A'] }))
      .toEqual({ options: ['A', 'B'], correctes: [0], optionsIllisibles: false, bonneReponseOrpheline: false })
  })

  it('nombre et booléen : leur texte, pour les options ET les bonnes réponses', () => {
    expect(lireOptionsQuestion({ type: 'qcm_multiple', options: [1, 2, true], correct_answers: [2, true] }))
      .toEqual({ options: ['1', '2', 'true'], correctes: [1, 2], optionsIllisibles: false, bonneReponseOrpheline: false })
  })

  it('null : une option vide (l’enregistrement la retire comme une option laissée vide)', () => {
    expect(lireOptionsQuestion({ type: 'qcm', options: ['A', null, 'B'], correct_answers: ['A'] }).options)
      .toEqual(['A', '', 'B'])
  })

  it.each([
    ['un élément objet', [{ texte: 'A' }, 'B'], ['B']],
    ['un élément liste', [['A'], 'B'], ['B']],
    ['un objet associatif à la place de la liste', { a: 'X', b: 'Y' }, ['X']],
    ['une bonne réponse objet', ['A', 'B'], [{ texte: 'A' }]],
  ])('%s : illisible, rien de fabriqué, options à ressaisir', (_, options, correct_answers) => {
    const lu = lireOptionsQuestion({ type: 'qcm', options, correct_answers })
    expect(lu).toEqual({ options: VIDES, correctes: [], optionsIllisibles: true, bonneReponseOrpheline: false })
    expect(JSON.stringify(lu)).not.toContain('[object Object]')
  })

  // D446 : un vrai/faux illisible repart avec ses deux réponses fixes, pas quatre options libres.
  it('un vrai/faux illisible : ses deux réponses fixes, modifiables', () => {
    const lu = lireOptionsQuestion({ type: 'vrai_faux', options: [{ v: true }, 'Faux'], correct_answers: ['Faux'] })
    expect(lu).toEqual({ options: ['Vrai', 'Faux'], correctes: [], optionsIllisibles: true, bonneReponseOrpheline: false })
    expect(() => lu.options.push('x')).not.toThrow()
  })

  it('options ou bonnes réponses absentes : des listes vides, lisibles', () => {
    expect(lireOptionsQuestion({ type: 'qcm' })).toEqual({ options: [], correctes: [], optionsIllisibles: false, bonneReponseOrpheline: false })
  })

  // D466 (D467) : une bonne réponse déjà orpheline en base est MARQUÉE, jamais jetée en silence.
  it('une bonne réponse absente des options : marquée orpheline', () => {
    expect(lireOptionsQuestion({ type: 'qcm', options: ['A', 'B'], correct_answers: ['Z'] }))
      .toEqual({ options: ['A', 'B'], correctes: [], optionsIllisibles: false, bonneReponseOrpheline: true })
    expect(lireOptionsQuestion({ type: 'qcm_multiple', options: ['A', 'B'], correct_answers: ['A', 'Z'] }))
      .toEqual({ options: ['A', 'B'], correctes: [0], optionsIllisibles: false, bonneReponseOrpheline: true })
  })

  it('une question sans choix (réponse courte, dissertation) n’est pas jugée sur ses options', () => {
    expect(lireOptionsQuestion({ type: 'dissertation', options: { a: 1 }, correct_answers: null }).optionsIllisibles).toBe(false)
  })
})

describe('optionsRessaisies (B7)', () => {
  it('une question lisible est toujours prête', () => {
    expect(optionsRessaisies({ optionsIllisibles: false, options: [] })).toBe(true)
  })

  // Migration déclarée (D451) : deux options ne suffisent plus ; il faut aussi une bonne réponse,
  // et qu'elle soit l'une des options ressaisies.
  it('une question illisible l’est avec deux options ressaisies ET une bonne réponse parmi elles', () => {
    const q = (options, correctes) => ({ optionsIllisibles: true, options, correctes })
    expect(optionsRessaisies(q(['', '', '', ''], []))).toBe(false)
    expect(optionsRessaisies(q(['X', ' ', '', ''], [0]))).toBe(false)
    expect(optionsRessaisies(q(['X', 'Y', '', ''], []))).toBe(false)
    expect(optionsRessaisies(q(['X', 'Y', '', ''], [2]))).toBe(false)
    expect(optionsRessaisies(q(['X', 'Y', '', ''], [0]))).toBe(true)
  })

  it('un vrai/faux illisible : ses deux réponses fixes ne suffisent pas, il faut en choisir une', () => {
    expect(optionsRessaisies({ optionsIllisibles: true, options: ['Vrai', 'Faux'], correctes: [] })).toBe(false)
    expect(optionsRessaisies({ optionsIllisibles: true, options: ['Vrai', 'Faux'], correctes: [0] })).toBe(true)
  })
})

it('le texte du front pour une question illisible (D442)', () => {
  expect(ERROR_MESSAGES.optionsIllisibles)
    .toBe("Les options de cette question n'ont pas pu être relues. Saisissez-les de nouveau avant d'enregistrer.")
})
