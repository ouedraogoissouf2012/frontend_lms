/**
 * Lecture honnête, point 2 (repli DÉCLARÉ) : dans une école créée depuis le LMS, une séance locale ne
 * porte pas d'id de matière (SeanceIdentite::locale met matiereId à null ; la table `seances` n'a pas de
 * colonne de matière locale). Choisir une matière vidait donc la liste. Repli : rapprocher par le NOM,
 * insensible à la casse et aux espaces ; 'N/A' n'est pas un nom.
 *
 * LIMITE CONNUE, figée ici : deux matières locales distinctes au même nom (dans des classes différentes)
 * sont fusionnées par ce filtre. Cible : le lot backend « seances.matiere_id » ; une fois fusionné, le
 * filtre passe à l'id et ce test des homonymes s'inverse.
 */
import { describe, it, expect } from 'vitest'
import { filterSeances, cleMatiere } from '@/utils/seances'

const s = (id, matiere, classe = 'A') => ({ id, matiere, classe: { nom: classe } })

describe('cleMatiere — l’id quand il existe, sinon le nom normalisé', () => {
  it('id → l’id ; nom seul → « nom: » + nom normalisé ; ni l’un ni l’autre (ou N/A) → null', () => {
    expect(cleMatiere(s(1, { id: 5, nom: 'Maths' }))).toBe(5)
    expect(cleMatiere(s(2, { id: null, nom: '  Maths   Avancées ' }))).toBe('nom:maths avancées')
    expect(cleMatiere(s(3, { id: null, nom: 'N/A' }))).toBeNull()
    expect(cleMatiere(s(4, null))).toBeNull()
  })
})

describe('filterSeances — matière sans id rapprochée par le nom', () => {
  const MATIERES = [{ id: 5, nom: 'MATHS' }, { id: 6, nom: 'Physique' }]

  it('choisir une matière garde ses séances locales (sans id), insensible à la casse et aux espaces', () => {
    const seances = [s(1, { id: null, nom: 'Maths' }), s(2, { id: null, nom: ' maths ' }), s(3, { id: null, nom: 'Physique' })]
    expect(filterSeances(seances, { matiere_id: 5 }, MATIERES).map((x) => x.id)).toEqual([1, 2])
  })

  it('une séance qui porte un id est filtrée par l’id, jamais par le nom', () => {
    const seances = [s(1, { id: 6, nom: 'Maths' }), s(2, { id: 5, nom: 'Autre' })]
    expect(filterSeances(seances, { matiere_id: 5 }, MATIERES).map((x) => x.id)).toEqual([2])
  })

  it('LIMITE FIGÉE : deux matières homonymes de classes différentes sont fusionnées par le nom', () => {
    const homonymes = [{ id: 5, nom: 'Maths' }, { id: 7, nom: 'Maths' }]
    const seances = [s(1, { id: null, nom: 'Maths' }, '6e A'), s(2, { id: null, nom: 'Maths' }, '5e B')]
    // Choisir la matière 5 (6e A) garde AUSSI la séance de la matière 7 (5e B) : sans id côté serveur,
    // rien ne les distingue. Voir le lot backend « seances.matiere_id ».
    expect(filterSeances(seances, { matiere_id: 5 }, homonymes).map((x) => x.id)).toEqual([1, 2])
  })
})
