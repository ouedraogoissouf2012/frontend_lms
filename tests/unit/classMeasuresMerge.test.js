/**
 * Fusion des effectifs dans les classes du tableau de bord enseignant.
 *
 * `/proxy/me/teacher-dashboard` dit QUELLES classes l'enseignant a, mais ne porte
 * ni effectif ni capacité (mesuré : id, name, libelle, filiere, niveau). C'est
 * `/proxy/classes` qui les porte, pour les 17 classes de l'établissement et en un
 * seul appel — d'où une fusion par identifiant, sans N+1.
 *
 * Cas mesurés sur l'établissement de référence :
 *   B2 COM 6/30 · B3 COM 5/30 · BTS Génie Civil 2/35 · ROSTAN 0/30
 *
 * ROSTAN vaut un VRAI zéro : la fusion doit le transmettre comme une mesure, pas
 * le confondre avec l'absence de donnée.
 */
import { describe, it, expect } from 'vitest'
import { mergeClassMeasures } from '@/utils/classMeasures'

/** Forme réelle du dashboard : aucune donnée d'effectif. */
const DASHBOARD = [
  { id: 1, name: 'B2 COM', libelle: null },
  { id: 5, name: 'ROSTAN BTS BATIMENT', libelle: null },
]

/** Forme réelle de /proxy/classes : effectif et capacité présents. */
const REFERENTIEL = [
  { id: 1, name: 'B2 COM', places_occupees: 6, places_totales: 30 },
  { id: 2, name: 'B3 COM', places_occupees: 5, places_totales: 30 },
  { id: 5, name: 'ROSTAN BTS BATIMENT', places_occupees: 0, places_totales: 30 },
]

import { enrichTeacherClasses } from '@/utils/classStats'

describe('enrichTeacherClasses + fusion', () => {
  it('conserve le nombre de matieres MESURE par classe', () => {
    // Sans cette priorite, l'enrichissement ecrasait la mesure par le total des
    // matieres de l'enseignant : le meme chiffre sur toutes les cartes.
    const fusionnees = [
      { id: 1, name: 'B2 COM', nb_matieres: 3 },
      { id: 5, name: 'ROSTAN', nb_matieres: 0 },
    ]
    const matieresEnseignant = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }]

    const [b2, rostan] = enrichTeacherClasses(fusionnees, matieresEnseignant)

    expect(b2.nb_matieres).toBe(3)
    expect(rostan.nb_matieres).toBe(0)
  })
})

describe('mergeClassMeasures', () => {
  it('complete chaque classe avec son effectif et sa capacite', () => {
    const [b2] = mergeClassMeasures(DASHBOARD, REFERENTIEL)

    expect(b2.places_occupees).toBe(6)
    expect(b2.places_totales).toBe(30)
  })

  it('transmet un zero MESURE, sans le confondre avec une absence', () => {
    const rostan = mergeClassMeasures(DASHBOARD, REFERENTIEL)[1]

    // La classe existe et compte réellement 0 inscrit : c'est un fait, pas un trou.
    expect(rostan.places_occupees).toBe(0)
    expect(rostan.places_totales).toBe(30)
  })

  it('n invente rien pour une classe absente du referentiel', () => {
    const [inconnue] = mergeClassMeasures([{ id: 99, name: 'Inconnue' }], REFERENTIEL)

    expect(inconnue.places_occupees).toBeNull()
    expect(inconnue.places_totales).toBeNull()
  })

  it('laisse les classes intactes quand le referentiel est indisponible', () => {
    // Échec de l'appel : on ne remplace pas une absence par un chiffre.
    const [b2] = mergeClassMeasures(DASHBOARD, null)

    expect(b2.places_occupees).toBeNull()
    expect(b2.name).toBe('B2 COM')
  })

  it('apparie meme si les identifiants different de type', () => {
    // Les ids KLASSCI arrivent tantôt en nombre, tantôt en chaîne selon l'endpoint.
    const [classe] = mergeClassMeasures([{ id: '1', name: 'B2 COM' }], REFERENTIEL)

    expect(classe.places_occupees).toBe(6)
  })

  it('reprend le nombre de matieres de LA CLASSE', () => {
    // Chaque carte affichait « Matieres 6 » : le total des matieres de
    // l'enseignant, repete a l'identique sur toutes ses classes. Le referentiel
    // porte la vraie repartition, classe par classe.
    const referentiel = [
      { id: 1, matieres_disponibles: [{ id: 3 }, { id: 1 }, { id: 2 }] },
      { id: 5, matieres_disponibles: [] },
    ]

    const [b2, rostan] = mergeClassMeasures(
      [{ id: 1, name: 'B2 COM' }, { id: 5, name: 'ROSTAN' }],
      referentiel,
    )

    expect(b2.nb_matieres).toBe(3)
    // Zero MESURE : cette classe n'a effectivement aucune matiere rattachee.
    expect(rostan.nb_matieres).toBe(0)
  })

  it('laisse nb_matieres a null quand le referentiel ne le porte pas', () => {
    const [classe] = mergeClassMeasures([{ id: 1, name: 'B2 COM' }], [{ id: 1 }])

    expect(classe.nb_matieres).toBeNull()
  })

  it('ne modifie pas les objets recus', () => {
    const source = [{ id: 1, name: 'B2 COM' }]
    mergeClassMeasures(source, REFERENTIEL)

    expect(source[0].places_occupees).toBeUndefined()
  })
})
