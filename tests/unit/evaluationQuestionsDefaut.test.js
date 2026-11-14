/**
 * B7, retouche (D446) : une question à choix illisible repart avec les options par défaut de SON
 * type, celles d'une question neuve. Le vrai/faux a deux réponses fixes, 'Vrai' et 'Faux', que la
 * page de passage et le corrigé lisent à la MÊME constante.
 */
import { describe, it, expect } from 'vitest'
import { OPTIONS_VRAI_FAUX, optionsParDefaut } from '@/constants/evaluationQuestions'

describe('options par défaut d’une question à choix (B7)', () => {
  it('le vrai/faux : les deux réponses fixes, figées', () => {
    expect(OPTIONS_VRAI_FAUX).toEqual(['Vrai', 'Faux'])
    expect(Object.isFrozen(OPTIONS_VRAI_FAUX)).toBe(true)
  })

  it('une copie neuve à chaque appel (l’éditeur la modifie)', () => {
    const a = optionsParDefaut('vrai_faux')
    expect(a).toEqual(['Vrai', 'Faux'])
    expect(a).not.toBe(OPTIONS_VRAI_FAUX)
    expect(optionsParDefaut('qcm')).toEqual(['', '', '', ''])
    expect(optionsParDefaut('qcm')).not.toBe(optionsParDefaut('qcm'))
    expect(optionsParDefaut('qcm_multiple')).toEqual(['', '', '', ''])
  })
})
