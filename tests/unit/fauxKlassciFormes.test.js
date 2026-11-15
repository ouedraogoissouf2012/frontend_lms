/**
 * D584 : le faux KLASSCI « école » de l'E2E n'INVENTE aucune clé. Chaque route dont la forme réelle est mesurée
 * (cache KLASSCI de la base de DEV, 22/09/2026, clés et types seuls : formes-mesurees.json) ne sert que des chemins
 * et des types de cette forme. Une route non mesurée est déclarée « non vérifiée », jamais transposée d'une autre.
 *
 * Pourquoi : K3 était VERT parce que le faux servait sur `GET /evaluations` les clés du TABLEAU DE BORD
 * (`lms_integration.can_submit_notes`), que la liste réelle ne porte pas (formes-klassci-dev.md, D582).
 */
import { describe, it, expect } from 'vitest'
import formes from '../fixtures/klassci/formes-mesurees.json'
import { COMPTES, REPONSES } from '../../e2e/klassci-ecole/jeu.mjs'
import { formeDe, ecartsDeForme } from '../../e2e/formesFaux.mjs'

// L'appel de chaque route mesurée : le compte qui l'appelle, et les identifiants de son chemin.
const APPELS = {
  'GET /evaluations': [COMPTES.enseignant, []],
  'GET /me/teacher-dashboard': [COMPTES.enseignant, []],
  'GET /classes/{id}': [COMPTES.enseignant, ['9101']],
  'GET /matieres/{id}': [COMPTES.enseignant, ['9201']],
  'GET /matieres': [COMPTES.enseignant, []],
  'GET /classes': [COMPTES.admin, []],
  'GET /emploi-temps': [COMPTES.enseignant, []],
  'GET /auth/me': [COMPTES.enseignant, []],
}

// Aucune réponse de ces routes n'est en cache : leur forme reste reconstituée depuis le code lecteur du back.
const NON_VERIFIEES = [
  'POST /auth/check-user', 'POST /auth/login', 'POST /auth/logout', 'GET /me/dashboard', 'GET /structure',
  'GET /filieres', 'GET /niveaux-etudes', 'GET /enseignants', 'POST /evaluations/{id}/notes',
]

describe('D584 — le faux KLASSCI ne sert que des formes mesurées', () => {
  it('la fixture mesurée porte sa provenance et toutes les routes appelées', () => {
    expect(formes.provenance).toMatch(/22\/09\/2026/)
    expect(Object.keys(formes.routes).sort()).toEqual(Object.keys(APPELS).sort())
  })

  it.each(Object.keys(APPELS))('%s : aucune clé inventée, aucun type faux', (route) => {
    const [compte, ids] = APPELS[route]
    expect(ecartsDeForme(formeDe(REPONSES[route](compte, null, ids)), formes.routes[route].chemins)).toEqual([])
  })

  it('chaque route du faux est soit mesurée, soit déclarée non vérifiée', () => {
    const declarees = [...Object.keys(formes.routes), ...NON_VERIFIEES].sort()
    expect(Object.keys(REPONSES).sort()).toEqual(declarees)
  })
})
