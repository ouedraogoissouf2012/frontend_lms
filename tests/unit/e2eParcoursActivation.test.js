/**
 * Parcours fonctionnel du LIEN D'ACTIVATION MORT (#614) : ce que la relecture exige pour dire VERT. Le serveur rend
 * 410, l'écran porte le texte neutre du catalogue du front, le lien vers « Mot de passe oublié », et plus de formulaire.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DONNEES_ACTIVATION, ETAPES_ACTIVATION, TEXTE_LIEN_MORT, jugerLienMort } from '../../e2e/parcours-activation.mjs'
import { ERROR_MESSAGES } from '../../src/constants/errorMessages.js'

const ANCIEN = 'Ce lien n\'est plus valable. Demandez-en un nouveau à votre administrateur.'
const lecture = (champs = {}) => ({ statut: 410, ecran: `Choisir un mot de passe\n${TEXTE_LIEN_MORT}\nMot de passe oublié`, lienOublie: true, formulaire: false, ...champs })

describe('parcours-activation — les étapes', () => {
  it('un anonyme rouvre un jeton inconnu, puis le jeton déjà consommé ; ni l’un ni l’autre ne dépend de l’autre', () => {
    expect(ETAPES_ACTIVATION.map((e) => [e.cle, e.compte, e.requiert])).toEqual([
      ['inconnu', 'anonyme', []],
      ['consomme', 'anonyme', []],
    ])
    expect(DONNEES_ACTIVATION.motDePasse.length).toBeGreaterThanOrEqual(8)
  })

  it('le texte attendu EST celui du catalogue du front (`gone`)', () => {
    expect(TEXTE_LIEN_MORT).toBe(ERROR_MESSAGES.gone)
  })

  it('le jeu de l’école LMS porte le jeton consommé à l’étape 3 de son montage', () => {
    const ps1 = readFileSync(resolve(process.cwd(), 'e2e/ecole-lms.ps1'), 'utf8')
    expect(ps1).toMatch(/jeton_consomme = \$jetonActivation/)
    expect(ps1).toMatch(/'3 activation' 'POST' '\/activation' @\{ token = \$jetonActivation/)
  })

  it('sans jeton consommé dans le jeu (école KLASSCI) : NON TESTÉ, jamais un vert', async () => {
    const consomme = ETAPES_ACTIVATION.find((e) => e.cle === 'consomme')
    const fait = await consomme.action({ jeu: { ecole: 'klassci' }, donnees: DONNEES_ACTIVATION, etat: {} })
    expect(fait.nonTeste).toMatch(/aucun lien d’activation consommé/)
  })
})

describe('parcours-activation — la relecture', () => {
  it('VERT : 410, le texte neutre, le lien « Mot de passe oublié », plus de formulaire', () => {
    expect(jugerLienMort(lecture(), 'jeton inconnu')).toEqual({
      confirme: true, preuve: 'jeton inconnu : HTTP 410, texte neutre du front, lien vers « Mot de passe oublié », formulaire retiré',
    })
  })

  it('ROUGE : l’ancien écran (ancien texte, formulaire, pas de lien)', () => {
    expect(jugerLienMort(lecture({ ecran: ANCIEN, lienOublie: false, formulaire: true }), 'x').ecart)
      .toBe('l’écran n’affiche pas le texte neutre du lien mort')
  })

  it('ROUGE : un autre statut, le lien absent, ou le formulaire resté', () => {
    expect(jugerLienMort(lecture({ statut: 200 }), 'x').ecart).toBe('POST /activation rend HTTP 200, 410 attendu')
    expect(jugerLienMort(lecture({ lienOublie: false }), 'x').ecart).toBe('aucun lien vers « Mot de passe oublié » (/forgot-password) à l’écran')
    expect(jugerLienMort(lecture({ formulaire: true }), 'x').ecart).toBe('le formulaire reste affiché sous un lien mort')
  })
})
