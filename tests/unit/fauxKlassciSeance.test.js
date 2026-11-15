/**
 * K4 (D609) : la séance de l'école KLASSCI vient de KLASSCI (`emploi-temps`). Le faux en sert UNE, depuis la forme
 * MESURÉE (formes-mesurees.json, D584) : l'enseignant de la classe la retrouve par `me/teacher-dashboard` puis
 * `emploi-temps` (EmploiTempsSeanceLocator:68-132, filtre sur `matiere.id`). Elle est datée du jour, dans la fenêtre
 * glissante que lit le back. `matieres/{id}.seances_programmees` reste non servie : vide dans toutes les réponses
 * mesurées, sa forme d'élément n'est pas capturée.
 */
import { describe, it, expect } from 'vitest'
import formes from '../fixtures/klassci/formes-mesurees.json'
import { COMPTES, REPONSES, SEANCE } from '../../e2e/klassci-ecole/jeu.mjs'
import { formeDe, ecartsDeForme } from '../../e2e/formesFaux.mjs'

const emploiTemps = (compte) => REPONSES['GET /emploi-temps'](compte, null, []).data

describe('K4 — le faux sert une séance KLASSCI, de forme mesurée', () => {
  it('l’enseignant de la classe la voit, dans sa matière et sa classe', () => {
    const [entree, ...reste] = emploiTemps(COMPTES.enseignant)
    expect(reste).toEqual([])
    expect(entree).toMatchObject({ id: SEANCE.id, matiere: { id: 9201 }, classe: { id: 9101 } })
    expect(COMPTES.enseignant.matieres).toContain(entree.matiere.id)
  })

  it('elle est datée du jour (dans la fenêtre glissante du back)', () => {
    const [entree] = emploiTemps(COMPTES.enseignant)
    expect(entree.programmation.date_seance).toBe(new Date().toISOString().slice(0, 10))
  })

  it('elle ne sert que des clés mesurées', () => {
    const reponse = REPONSES['GET /emploi-temps'](COMPTES.enseignant, null, [])
    expect(ecartsDeForme(formeDe(reponse), formes.routes['GET /emploi-temps'].chemins)).toEqual([])
  })

  it('`matieres/{id}` ne sert pas `seances_programmees` (forme non capturée)', () => {
    expect(REPONSES['GET /matieres/{id}'](COMPTES.enseignant, null, ['9201']).data).not.toHaveProperty('seances_programmees')
  })
})
