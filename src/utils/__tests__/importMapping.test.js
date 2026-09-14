import { describe, expect, it } from 'vitest'
import { autoMap, mappingIssues } from '../importMapping'

/**
 * #334 — toutes les règles de cartographie vivent ici, en fonctions pures.
 * Le composable ne fait que les appeler : c'est ce qui permet de les couvrir
 * sans monter de composant.
 */
describe('mappingIssues', () => {
  it('reclame les champs requis absents', () => {
    const issues = mappingIssues({}, ['nom', 'prenom'])

    expect(issues).toHaveLength(1)
    expect(issues[0]).toContain('Nom')
    expect(issues[0]).toContain('Prénom')
  })

  it('reclame un moyen de contact', () => {
    // Le serveur refuse toute ligne sans email NI téléphone : l'écran le
    // disait déjà en toutes lettres sans jamais le vérifier.
    const issues = mappingIssues({ nom: 'Nom', prenom: 'Prenom' }, ['nom', 'prenom'])

    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatch(/courriel|téléphone/i)
  })

  it('accepte le telephone seul', () => {
    expect(mappingIssues({ nom: 'Nom', prenom: 'Prenom', telephone: 'Tel' }, ['Nom', 'Prenom', 'Tel'])).toEqual([])
  })

  it('accepte le courriel seul', () => {
    expect(mappingIssues({ nom: 'Nom', prenom: 'Prenom', email: 'Mail' }, ['Nom', 'Prenom', 'Mail'])).toEqual([])
  })

  it('refuse deux champs branches sur la meme colonne', () => {
    const issues = mappingIssues(
      { nom: 'Identite', prenom: 'Identite', telephone: 'Tel' },
      ['Identite', 'Tel'],
    )

    expect(issues).toHaveLength(1)
    expect(issues[0]).toContain('Identite')
  })

  it('refuse une colonne absente du fichier', () => {
    // Cas réel : on revient à l'étape 1, on choisit un autre fichier, et la
    // cartographie précédente désigne des colonnes qui n'existent plus.
    const issues = mappingIssues({ nom: 'Ancienne', prenom: 'Prenom', telephone: 'Tel' }, ['Prenom', 'Tel'])

    expect(issues).toHaveLength(1)
    expect(issues[0]).toContain('Ancienne')
  })

  it('refuse un fichier dont deux colonnes portent le meme nom', () => {
    // Le serveur rejette ce fichier (code duplicate_header) : le dire avant de
    // faire remplir une cartographie qui ne peut pas aboutir.
    const issues = mappingIssues(
      { nom: 'Nom', prenom: 'Prenom', telephone: 'Tel' },
      ['Nom', 'Nom', 'Prenom', 'Tel'],
    )

    expect(issues).toHaveLength(1)
    expect(issues[0]).toContain('Nom')
  })

  it('voit dupliquees deux colonnes qui ne different que par la casse', () => {
    // Le serveur passe les en-têtes en minuscules avant de les comparer : pour
    // lui « Nom » et « nom » sont la même colonne, et il refuse le fichier.
    // Comparer les chaînes brutes ici donnerait un feu vert démenti aussitôt.
    const issues = mappingIssues(
      { nom: 'Nom', prenom: 'Prenom', telephone: 'Tel' },
      ['Nom', 'nom', 'Prenom', 'Tel'],
    )

    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatch(/s'appellent/i)
  })

  it('refuse deux colonnes SANS NOM, que le serveur compte comme doublon', () => {
    // Un point-virgule en trop suffit à produire « nom;;;prenom ». Le serveur
    // normalise puis compare : deux chaînes vides sont pour lui deux colonnes
    // de même nom, et il refuse le fichier en 422. Mesuré.
    const issues = mappingIssues(
      { nom: 'nom', prenom: 'prenom', telephone: 'tel' },
      ['nom', '', '', 'prenom', 'tel'],
    )

    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatch(/pas de nom/i)
  })

  it('tolere UNE seule colonne sans nom, que le serveur accepte', () => {
    expect(mappingIssues(
      { nom: 'nom', prenom: 'prenom', telephone: 'tel' },
      ['nom', '', 'prenom', 'tel'],
    )).toEqual([])
  })

  it('ignore les champs laisses vides', () => {
    expect(mappingIssues({ nom: 'Nom', prenom: 'Prenom', email: '', telephone: 'Tel' }, ['Nom', 'Prenom', 'Tel'])).toEqual([])
  })
})

describe('autoMap', () => {
  it('associe les en-tetes identiques', () => {
    expect(autoMap(['nom', 'prenom'])).toEqual({ nom: 'nom', prenom: 'prenom' })
  })

  it('associe malgre les accents et la casse', () => {
    // « Prénom » d'un export Excel francophone n'était pas reconnu.
    expect(autoMap(['Nom', 'Prénom'])).toEqual({ nom: 'Nom', prenom: 'Prénom' })
  })

  it('associe malgre les espaces et un libelle courant', () => {
    expect(autoMap(['  Nom  ', 'Téléphone'])).toEqual({ nom: 'Nom', telephone: 'Téléphone' })
  })

  it('reconnait les synonymes usuels', () => {
    expect(autoMap(['Courriel'])).toEqual({ email: 'Courriel' })
    expect(autoMap(['E-mail'])).toEqual({ email: 'E-mail' })
    expect(autoMap(['WhatsApp'])).toEqual({ telephone: 'WhatsApp' })
  })

  it('n associe pas deux fois la meme colonne', () => {
    // Deux en-têtes qui visent le même champ : le premier gagne, sinon la
    // cartographie proposée serait invalide d'entrée.
    expect(autoMap(['Nom', 'nom'])).toEqual({ nom: 'Nom' })
  })

  it('rend un objet vide quand rien ne correspond', () => {
    expect(autoMap(['colonne1', 'colonne2'])).toEqual({})
  })
})
