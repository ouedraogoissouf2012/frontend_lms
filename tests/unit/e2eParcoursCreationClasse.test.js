/**
 * Parcours fonctionnel de la CRÉATION D'UNE CLASSE (#632) : ce que la relecture exige pour dire VERT. La classe créée
 * apparaît à l'écran rechargé avec sa capacité, et `GET /classes` la porte ; le même code une seconde fois rend 422,
 * le texte du front est RELIÉ au champ du code, et aucune seconde classe n'existe.
 */
import { describe, expect, it } from 'vitest'
import { DONNEES_CREATION, ETAPES_CREATION, TEXTE_CODE_DEJA_EMPLOYE, jugerCreation, jugerDoublon } from '../../e2e/parcours-creation-classe.mjs'
import { ERROR_MESSAGES } from '../../src/constants/errorMessages.js'

const D = DONNEES_CREATION
const page = (...lignes) => ({ statut: 200, corps: { data: lignes } })
const LIGNE = { libelle: D.libelle, code: D.code, effectif: D.capacite }
const creation = (champs = {}) => ({ statut: 201, carte: `${D.libelle}\nCapacité : ${D.capacite} élèves`, api: page(LIGNE), ...champs })
const doublon = (champs = {}) => ({ statut: 422, decritCode: TEXTE_CODE_DEJA_EMPLOYE, invalide: 'true', api: page(LIGNE), ...champs })

describe('parcours-creation-classe — les étapes', () => {
  it('créer, puis le doublon (qui exige la création) ; tout par l’admin', () => {
    expect(ETAPES_CREATION.map((e) => [e.cle, e.compte, e.requiert])).toEqual([['creer', 'admin', []], ['doublon', 'admin', ['creer']]])
    expect(D.code.length).toBeLessThanOrEqual(50)
  })

  it('le texte recopié EST celui du catalogue du front', () => {
    expect(TEXTE_CODE_DEJA_EMPLOYE).toBe(ERROR_MESSAGES.classeCodeDejaEmploye)
  })

  it('en école KLASSCI : NON TESTÉ déclaré, jamais un vert', async () => {
    expect((await ETAPES_CREATION[0].action({ jeu: { ecole: 'klassci' }, donnees: D, etat: {} })).nonTeste).toMatch(/peutInscrireLocalement/)
  })
})

describe('parcours-creation-classe — la création relue', () => {
  it('VERT : 201, carte rechargée avec sa capacité, ligne de GET /classes conforme', () => {
    expect(jugerCreation(creation(), D)).toMatchObject({ confirme: true })
  })

  it('ROUGE : un refus, une carte absente ou sans sa capacité, une ligne absente ou fausse', () => {
    expect(jugerCreation(creation({ statut: 403 }), D).ecart).toMatch(/403/)
    expect(jugerCreation(creation({ carte: null }), D).ecart).toMatch(/n’apparaît pas/)
    expect(jugerCreation(creation({ carte: `${D.libelle}\nCapacité : sans limite` }), D).ecart).toMatch(/Capacité : 20/)
    expect(jugerCreation(creation({ api: page() }), D).ecart).toMatch(/ne porte pas/)
    expect(jugerCreation(creation({ api: page({ ...LIGNE, effectif: 0 }) }), D).confirme).toBe(false)
  })
})

describe('parcours-creation-classe — le code en double relu', () => {
  it('VERT : 422, texte relié au champ, champ invalide, aucune seconde classe', () => {
    expect(jugerDoublon(doublon(), D)).toMatchObject({ confirme: true })
  })

  it('ROUGE : un 500 (le défaut d’avant lms_backend#1521), ou un 201', () => {
    expect(jugerDoublon(doublon({ statut: 500 }), D).ecart).toMatch(/500.*#1521/)
    expect(jugerDoublon(doublon({ statut: 201 }), D).confirme).toBe(false)
  })

  it('ROUGE : le texte n’est pas relié au champ, ou le champ n’est pas invalide', () => {
    expect(jugerDoublon(doublon({ decritCode: '' }), D).ecart).toMatch(/n’est pas décrit/)
    expect(jugerDoublon(doublon({ invalide: 'false' }), D).ecart).toMatch(/aria-invalid/)
  })

  it('ROUGE : une seconde classe existe', () => {
    expect(jugerDoublon(doublon({ api: page(LIGNE, { libelle: D.doublon, code: D.code }) }), D).ecart).toMatch(/seconde classe/)
  })
})
