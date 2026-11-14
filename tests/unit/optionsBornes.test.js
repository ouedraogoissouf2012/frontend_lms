/**
 * B5 (D461, lms_backend #1069) : une question à choix compte au plus 26 options, de 1 000 caractères
 * chacune. Les bornes du front reflètent `QuestionOptionLimits` du back, qui reste la vérité.
 */
import { describe, it, expect } from 'vitest'
import { MAX_OPTIONS, MAX_OPTION_LENGTH } from '@/constants/evaluationQuestions'
import { optionsHorsBornes } from '@/utils/optionsQuestion'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const n = (k, longueur = 1) => Array.from({ length: k }, (_, i) => String.fromCharCode(65 + (i % 26)).repeat(longueur))

describe('bornes des options (B5)', () => {
  it('26 options, de 1 000 caractères', () => {
    expect(MAX_OPTIONS).toBe(26)
    expect(MAX_OPTION_LENGTH).toBe(1000)
  })

  it('les textes du front (D461)', () => {
    expect(ERROR_MESSAGES.optionsMaxAtteint).toBe('Une question compte au plus 26 options.')
    expect(ERROR_MESSAGES.optionsHorsBornes)
      .toBe("Cette question dépasse les bornes : 26 options au plus, de 1 000 caractères chacune. Retirez ou raccourcissez des options avant d'enregistrer.")
  })
})

describe('optionsHorsBornes (B5)', () => {
  it.each([
    ['27 options', n(27), true],
    ['26 options (témoin)', n(26), false],
    ['une option de 1 001 caractères', ['A'.repeat(1001), 'B'], true],
    ['26 options de 1 000 caractères (témoin)', n(26, 1000), false],
    ['26 options remplies et une vide : l’envoi retire la vide', [...n(26), ''], false],
  ])('%s', (_, options, attendu) => {
    expect(optionsHorsBornes({ type: 'qcm', options })).toBe(attendu)
  })

  it('une question sans choix n’est pas jugée sur ses options', () => {
    expect(optionsHorsBornes({ type: 'dissertation', options: n(30) })).toBe(false)
  })
})
