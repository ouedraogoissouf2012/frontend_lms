/**
 * B7 (#1059) : des options d'une question à choix enregistrées AVANT #1059 peuvent ne pas être des
 * textes (nombre, booléen, null, objet, liste, voire un objet associatif à la place de la liste).
 * L'éditeur les lit par une seule fonction pure, au chargement, pour les options ET les bonnes
 * réponses (comparées par valeur aux options). Aucun texte fabriqué, aucune suppression muette.
 */
import { describe, it, expect } from 'vitest'
import { lireOptionsQuestion, optionsRessaisies } from '@/utils/optionsQuestion'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const VIDES = ['', '', '', '']

describe('lireOptionsQuestion (B7)', () => {
  it('une liste de textes reste identique', () => {
    expect(lireOptionsQuestion({ type: 'qcm', options: ['A', 'B'], correct_answers: ['A'] }))
      .toEqual({ options: ['A', 'B'], correct_answers: ['A'], optionsIllisibles: false })
  })

  it('nombre et booléen : leur texte, pour les options ET les bonnes réponses', () => {
    expect(lireOptionsQuestion({ type: 'qcm_multiple', options: [1, 2, true], correct_answers: [2, true] }))
      .toEqual({ options: ['1', '2', 'true'], correct_answers: ['2', 'true'], optionsIllisibles: false })
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
    expect(lu).toEqual({ options: VIDES, correct_answers: [], optionsIllisibles: true })
    expect(JSON.stringify(lu)).not.toContain('[object Object]')
  })

  it('options ou bonnes réponses absentes : des listes vides, lisibles', () => {
    expect(lireOptionsQuestion({ type: 'qcm' })).toEqual({ options: [], correct_answers: [], optionsIllisibles: false })
  })

  it('une question sans choix (réponse courte, dissertation) n’est pas jugée sur ses options', () => {
    expect(lireOptionsQuestion({ type: 'dissertation', options: { a: 1 }, correct_answers: null }).optionsIllisibles).toBe(false)
  })
})

describe('optionsRessaisies (B7)', () => {
  it('une question lisible est toujours prête', () => {
    expect(optionsRessaisies({ optionsIllisibles: false, options: [] })).toBe(true)
  })

  it('une question illisible l’est quand au moins deux options sont ressaisies', () => {
    expect(optionsRessaisies({ optionsIllisibles: true, options: ['', '', '', ''] })).toBe(false)
    expect(optionsRessaisies({ optionsIllisibles: true, options: ['X', ' ', '', ''] })).toBe(false)
    expect(optionsRessaisies({ optionsIllisibles: true, options: ['X', 'Y', '', ''] })).toBe(true)
  })
})

it('le texte du front pour une question illisible (D442)', () => {
  expect(ERROR_MESSAGES.optionsIllisibles)
    .toBe("Les options de cette question n'ont pas pu être relues. Saisissez-les de nouveau avant d'enregistrer.")
})
