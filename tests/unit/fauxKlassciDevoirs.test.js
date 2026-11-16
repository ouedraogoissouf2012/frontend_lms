/**
 * PR 3 (le devoir), école KLASSCI : le devoir y est la version EN LIGNE d'une évaluation PROGRAMMÉE dans KLASSCI.
 * La 9601 est prise par le montage K3 (sa version en ligne existe déjà : une seconde rendrait 409). Le faux sert
 * donc deux programmations de plus, de la MÊME forme mesurée : 9602 (le devoir corrigé puis synchronisé) et 9603
 * (l'évaluation B, modifiée puis supprimée). Le journal du faux garde la VALEUR des notes envoyées (données
 * fictives, validé) : la note synchronisée doit valoir celle corrigée.
 */
import { describe, it, expect } from 'vitest'
import formes from '../fixtures/klassci/formes-mesurees.json'
import { COMPTES, REPONSES, EVALUATION, DEVOIRS, jeuDuParcours, entreeDuJournal } from '../../e2e/klassci-ecole/jeu.mjs'
import { formeDe, ecartsDeForme } from '../../e2e/formesFaux.mjs'

const liste = (compte) => REPONSES['GET /evaluations'](compte, null, []).data

describe('faux KLASSCI — deux programmations de plus pour le devoir', () => {
  it('9602 (le devoir) et 9603 (l’évaluation B), dans la classe et la matière de l’enseignant', () => {
    expect(DEVOIRS).toEqual({
      principal: { id: 9602, titre: 'Devoir dissertation K E2E', classe: 9101, matiere: 9201 },
      b: { id: 9603, titre: 'Devoir B K E2E', classe: 9101, matiere: 9201 },
    })
  })

  it('l’enseignant et l’élève de la classe voient les trois programmations (9601 de K3 comprise)', () => {
    expect(liste(COMPTES.enseignant).map((e) => e.id)).toEqual([EVALUATION.id, 9602, 9603])
    expect(liste(COMPTES.etudiant).map((e) => e.id)).toEqual([EVALUATION.id, 9602, 9603])
  })

  it('chacune ne sert que des clés MESURÉES (garde des formes : 0 écart)', () => {
    const reponse = REPONSES['GET /evaluations'](COMPTES.enseignant, null, [])
    expect(ecartsDeForme(formeDe(reponse), formes.routes['GET /evaluations'].chemins)).toEqual([])
  })

  it('les notes de 9602 sont reçues ; une évaluation hors du jeu reste inconnue', () => {
    expect(REPONSES['POST /evaluations/{id}/notes'](COMPTES.enseignant, { notes: [] }, ['9602'])).toEqual({ success: true })
    expect(REPONSES['POST /evaluations/{id}/notes'](COMPTES.enseignant, { notes: [] }, ['9999'])).toBeUndefined()
  })

  it('le parcours reçoit les ids des devoirs', () => {
    expect(jeuDuParcours().devoirs).toEqual({ principal: DEVOIRS.principal, b: DEVOIRS.b })
  })
})

describe('faux KLASSCI — le journal garde la valeur des notes envoyées', () => {
  it('nombre, clés ET valeurs des notes (fictives)', () => {
    const corps = { notes: [{ etudiant_id: 9304, note: 20, commentaire: 'Bien', is_absent: false }] }
    expect(entreeDuJournal(corps)).toEqual({ nb_notes: 1, cles_notes: ['etudiant_id', 'note', 'commentaire', 'is_absent'], valeurs_notes: [20] })
  })

  it('un corps sans notes : rien de plus au journal', () => {
    expect(entreeDuJournal({ autre: 1 })).toEqual({})
    expect(entreeDuJournal(null)).toEqual({})
  })
})
