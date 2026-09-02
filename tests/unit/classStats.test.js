import { describe, expect, it } from 'vitest'
import {
  countDistinctFilieres,
  deriveInstitutionCounters,
  countDistinctNiveaux,
  enrichTeacherClasses,
  getAssignedClassIds,
  getClassCapacity,
  getClassMatiereCount,
  getClassStudentCount
} from '@/utils/classStats'

describe('classStats (#100)', () => {
  it('derive les compteurs depuis les champs de liste sans roster', () => {
    const classe = { places_occupees: 12, places_totales: 28 }
    expect(getClassStudentCount(classe)).toBe(12)
    expect(getClassCapacity(classe, 12)).toBe(28)
  })

  it('utilise effectif comme compteur et garde une capacite fallback', () => {
    expect(getClassStudentCount({ effectif: 34 })).toBe(34)
    expect(getClassCapacity({}, 34)).toBe(34)
  })

  it('ignore les valeurs vides avant de choisir un compteur fallback', () => {
    expect(getClassStudentCount({ places_occupees: null, nb_etudiants: 18 })).toBe(18)
    expect(getClassCapacity({ places_totales: '', capacite: 24 }, 18)).toBe(24)
  })

  it('collecte les classes rattachees depuis plusieurs formes de matieres', () => {
    const ids = getAssignedClassIds([
      { classes: [{ id: 5 }] },
      { classe_ids: [6] },
      { klassci_classe_id: '7' }
    ])

    expect([...ids].sort()).toEqual(['5', '6', '7'])
  })

  it('filtre les classes et compte les matieres liees quand le lien existe', () => {
    const classes = [
      { id: 5, nb_etudiants: 18 },
      { id: 6, nb_etudiants: 22 }
    ]
    const matieres = [
      { id: 1, classes: [{ id: 5 }] },
      { id: 2, classe_id: 5 }
    ]

    expect(enrichTeacherClasses(classes, matieres)).toEqual([
      {
        id: 5,
        nb_etudiants: 18,
        places_occupees: 18,
        // `null` et non `30` : la classe ne porte aucune capacité. L'ancien `30`
        // était une constante en dur, donc une capacité inventée — indétectable
        // quand elle tombait juste.
        places_totales: null,
        nb_matieres: 2
      }
    ])
  })

  it('ne fabrique NI effectif NI capacite quand la source ne les porte pas', () => {
    // Forme RÉELLE des classes de /proxy/me/teacher-dashboard (mesurée) :
    // id, name, libelle, filiere, niveau — et rien d'autre. Ni effectif, ni capacité.
    const classes = [{ id: 1, name: 'B2 COM', libelle: null }]

    const [enrichie] = enrichTeacherClasses(classes, [])

    // `0` se lirait « cette classe n'a aucun étudiant », et `30` était une capacité
    // inventée par un `?? 30` en dur. La classe en compte 6 pour 30 places : les
    // deux chiffres étaient faux, et le 30 l'était de façon indétectable puisqu'il
    // tombait juste par coïncidence.
    expect(enrichie.places_occupees).toBeNull()
    expect(enrichie.places_totales).toBeNull()
  })

  it('conserve les valeurs REELLEMENT portees par la source', () => {
    const classes = [{ id: 5, nb_etudiants: 18, places_totales: 28 }]

    const [enrichie] = enrichTeacherClasses(classes, [])

    // Une mesure présente n'est jamais remplacée par un repli.
    expect(enrichie.places_occupees).toBe(18)
    expect(enrichie.places_totales).toBe(28)
  })

  it('compte les matieres par combinaison filiere/niveau sans multiplier le total global', () => {
    const classe = { id: 5, filiere: { id: 1 }, niveau: { id: 2 } }
    const matieres = [
      { id: 10, combinaisons: [{ filiere: { id: 1 }, niveau: { id: 2 } }] },
      { id: 11, combinaisons: [{ filiere: { id: 1 }, niveau: { id: 3 } }] },
      { id: 12, combinaisons: [{ filiere: { id: 9 }, niveau: { id: 2 } }] }
    ]

    expect(getClassMatiereCount(classe, matieres)).toBe(1)
  })

  it('retourne zero si aucune matiere ne porte de rattachement exploitable', () => {
    expect(getClassMatiereCount({ id: 5 }, [{ id: 1 }, { id: 2 }])).toBe(0)
  })
})

/**
 * Comptage des filières / niveaux DISTINCTS d'un ensemble de classes.
 *
 * Motif : le tableau de bord admin affichait « Filières 0 / Niveaux 0 » en
 * permanence (champs lus depuis un objet `stats` jamais peuplé), alors que la
 * page Classes dérivait 11 filières et 8 niveaux des MÊMES classes.
 */
describe('countDistinctFilieres / countDistinctNiveaux', () => {
  it('compte les filières distinctes, sans doublon', () => {
    const classes = [
      { id: 1, filiere: { id: 7, nom: 'BATIMENT' } },
      { id: 2, filiere: { id: 7, nom: 'BATIMENT' } },
      { id: 3, filiere: { id: 9, nom: 'INFORMATIQUE' } },
    ]
    expect(countDistinctFilieres(classes)).toBe(2)
  })

  it('compte les niveaux distincts en acceptant les variantes de champ', () => {
    const classes = [
      { id: 1, niveau: { id: 1, nom: 'BTS 1' } },
      { id: 2, niveau_etude: { id: 2, nom: 'BTS 2' } },
      { id: 3, niveau_id: 1 },
    ]
    expect(countDistinctNiveaux(classes)).toBe(2)
  })

  it('ignore les classes sans filière ni niveau', () => {
    expect(countDistinctFilieres([{ id: 1 }, { id: 2, filiere: null }])).toBe(0)
    expect(countDistinctNiveaux([{ id: 1 }, { id: 2, niveau: undefined }])).toBe(0)
  })

  it('renvoie 0 sur une entrée vide ou invalide (jamais de levée)', () => {
    expect(countDistinctFilieres([])).toBe(0)
    expect(countDistinctFilieres(null)).toBe(0)
    expect(countDistinctFilieres(undefined)).toBe(0)
    expect(countDistinctNiveaux([])).toBe(0)
    expect(countDistinctNiveaux(null)).toBe(0)
  })
})

/**
 * `deriveInstitutionCounters` — source UNIQUE des compteurs d'établissement.
 *
 * Trois écrans (tableau de bord, statistiques, profil) affichaient les mêmes
 * six compteurs via trois calculs distincts — dont deux branchés sur un
 * `admin_data.statistics` inexistant, qui rendait donc des zéros. Une seule
 * dérivation, pure et testée, remplace les trois.
 */
describe('deriveInstitutionCounters', () => {
  const classes = [
    { id: 1, places_occupees: 6, filiere: { id: 7 }, niveau: { id: 1 } },
    { id: 2, places_occupees: 5, filiere: { id: 9 }, niveau: { id: 1 } },
  ]

  it('dérive les six compteurs des données chargées', () => {
    const c = deriveInstitutionCounters({
      classes, matieres: [{ id: 1 }, { id: 2 }, { id: 3 }], enseignants: [{ id: 1 }, { id: 2 }],
    })
    expect(c).toEqual({
      nb_enseignants: 2,
      nb_etudiants: 11,
      nb_classes_actives: 2,
      nb_matieres_actives: 3,
      nb_filieres: 2,
      nb_niveaux: 1,
    })
  })

  it('marque NON MESURÉ (null) une source absente, sans contaminer les autres', () => {
    const c = deriveInstitutionCounters({ classes, matieres: null, enseignants: null })
    expect(c.nb_enseignants).toBe(null)
    expect(c.nb_matieres_actives).toBe(null)
    // Les compteurs dérivés des classes restent mesurés.
    expect(c.nb_classes_actives).toBe(2)
    expect(c.nb_etudiants).toBe(11)
    expect(c.nb_filieres).toBe(2)
  })

  it('rend tout null quand rien n’est fourni (jamais des zéros fabriqués)', () => {
    const c = deriveInstitutionCounters({})
    expect(Object.values(c).every(v => v === null)).toBe(true)
  })

  it('distingue un établissement RÉELLEMENT vide (listes vides → 0)', () => {
    const c = deriveInstitutionCounters({ classes: [], matieres: [], enseignants: [] })
    expect(c).toEqual({
      nb_enseignants: 0, nb_etudiants: 0, nb_classes_actives: 0,
      nb_matieres_actives: 0, nb_filieres: 0, nb_niveaux: 0,
    })
  })

  it('ignore un effectif non numérique au lieu de propager NaN', () => {
    const c = deriveInstitutionCounters({ classes: [{ id: 1, places_occupees: 'douze' }, { id: 2, places_occupees: 4 }] })
    expect(c.nb_etudiants).toBe(4)
  })
})
