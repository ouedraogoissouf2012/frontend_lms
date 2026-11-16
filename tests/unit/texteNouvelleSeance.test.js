/**
 * #580 : la modale « Nouvelle séance » disait « La visioconférence n'est pas encore disponible pour une séance créée
 * ici. ». C'est faux depuis que le back active la visio d'une séance locale (VisioServiceProvider → LocalVisioActivation) :
 * la carte de la séance propose « Activer la visio ». L'écran dit désormais ce qui est vrai.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const source = readFileSync(resolve(__dirname, '../../src/components/seances/SeanceCreateAction.vue'), 'utf8')

describe('#580 — « Nouvelle séance » ne dit plus que la visio est indisponible', () => {
  it('le texte périmé est retiré', () => {
    expect(source).not.toContain("La visioconférence n'est pas encore disponible pour une séance créée ici.")
  })

  it('l’écran dit où se pilote la visio : sur la carte de la séance, une fois créée', () => {
    expect(source).toContain('La visioconférence s’active ensuite depuis la carte de la séance.')
  })
})
