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

  it('ne modifie pas les objets recus', () => {
    const source = [{ id: 1, name: 'B2 COM' }]
    mergeClassMeasures(source, REFERENTIEL)

    expect(source[0].places_occupees).toBeUndefined()
  })
})
