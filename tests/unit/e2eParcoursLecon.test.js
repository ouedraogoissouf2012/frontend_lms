/**
 * Parcours fonctionnel de la LEÇON (PR 1) : ce que chaque relecture exige pour dire VERT, et l'ordre des étapes.
 * La suppression n'est VERTE que si la leçon a DISPARU (404 et absente de sa matière). « Modifier » est ROUGE,
 * nommé, tant qu'aucun champ ne porte le titre (#564).
 */
import { describe, it, expect } from 'vitest'
import {
  ETAPES_LECON, DONNEES_LECON, AUCUN_CHEMIN_MODIFICATION,
  jugerLecon, jugerClasse, jugerChapitre, jugerModification, jugerProgression, jugerSuppression,
} from '../../e2e/parcours-lecon.mjs'

const lecture = (statut, data) => ({ statut, corps: data === undefined ? null : { success: statut < 400, data } })
const TITRE = DONNEES_LECON.titre

describe('parcours-lecon — les étapes et ce qu’elles requièrent', () => {
  it('l’enseignant crée, ajoute un chapitre, modifie, publie ; l’élève ouvre et termine ; l’enseignant supprime', () => {
    expect(ETAPES_LECON.map((e) => [e.cle, e.compte, e.requiert])).toEqual([
      ['creer', 'enseignant', []],
      ['classe', 'enseignant', ['creer']],
      ['chapitre', 'enseignant', ['creer']],
      ['modifier', 'enseignant', ['creer']],
      ['publier', 'enseignant', ['creer']],
      ['ouvrir', 'etudiant', ['publier', 'chapitre', 'classe']],
      ['terminer', 'etudiant', ['ouvrir']],
      ['supprimer', 'enseignant', ['creer']],
    ])
  })

  it('aucune étape ne requiert « modifier » : son ROUGE n’arrête pas la chaîne de la leçon', () => {
    expect(ETAPES_LECON.some((e) => e.requiert.includes('modifier'))).toBe(false)
  })

  it('chaque étape a une action et une relecture', () => {
    for (const e of ETAPES_LECON) {
      expect(typeof e.action).toBe('function')
      expect(typeof e.relecture).toBe('function')
    }
    expect(Object.isFrozen(ETAPES_LECON)).toBe(true)
  })

  it('les données fictives ne portent aucun mot d’énumération (lu comme un texte brut)', () => {
    expect(Object.values(DONNEES_LECON).join(' ')).not.toMatch(/\b(published|draft|archived|completed)\b/i)
  })
})

describe('parcours-lecon — la création et la publication relues', () => {
  it('VERT : le titre saisi et le statut attendu sont relus', () => {
    expect(jugerLecon(lecture(200, { id: 5, title: TITRE, status: 'draft', classe_id: 3 }), 5, { titre: TITRE, statut: 'draft' }))
      .toEqual({ confirme: true, preuve: `leçon 5 relue : « ${TITRE} », statut draft, classe 3` })
  })

  it('ROUGE : la lecture échoue, le titre ou le statut diffère', () => {
    expect(jugerLecon(lecture(404), 5, { titre: TITRE, statut: 'draft' })).toEqual({ confirme: false, ecart: 'GET /lessons/5 rend HTTP 404' })
    expect(jugerLecon(lecture(200, { title: 'autre', status: 'draft' }), 5, { titre: TITRE, statut: 'draft' }).confirme).toBe(false)
    expect(jugerLecon(lecture(200, { title: TITRE, status: 'draft' }), 5, { titre: TITRE, statut: 'published' }))
      .toEqual({ confirme: false, ecart: 'statut relu « draft », « published » attendu' })
  })
})

describe('parcours-lecon — la classe de la leçon créée, relue (jamais supposée)', () => {
  it('VERT : la même classe que la leçon publiée du jeu, que l’élève voit', () => {
    expect(jugerClasse(lecture(200, { classe_id: 3 }), lecture(200, { classe_id: 3 }), 5, 1))
      .toEqual({ confirme: true, preuve: 'leçon 5 dans la classe 3, celle de l’élève' })
  })

  it('ROUGE : une autre classe (MATH est enseignée dans deux classes de l’école LMS)', () => {
    expect(jugerClasse(lecture(200, { classe_id: 4 }), lecture(200, { classe_id: 3 }), 5, 1))
      .toEqual({ confirme: false, ecart: 'leçon créée dans la classe 4, l’élève est dans la classe 3 : le formulaire ne fait pas choisir la classe' })
  })

  it('ROUGE : la référence illisible ou sans classe, jamais un VERT par défaut', () => {
    expect(jugerClasse(lecture(200, { classe_id: 3 }), lecture(404), 5, 1)).toEqual({ confirme: false, ecart: 'GET /lessons/1 rend HTTP 404' })
    expect(jugerClasse(lecture(200, { classe_id: null }), lecture(200, { classe_id: null }), 5, 1).confirme).toBe(false)
  })
})

describe('parcours-lecon — le chapitre relu', () => {
  it('VERT : le chapitre saisi est listé ; son id est rendu pour l’élève', () => {
    expect(jugerChapitre(lecture(200, [{ id: 8, title: DONNEES_LECON.chapitre }]), 5, DONNEES_LECON.chapitre)).toMatchObject({ confirme: true, id: 8 })
  })

  it('ROUGE : absent de la liste', () => {
    expect(jugerChapitre(lecture(200, []), 5, DONNEES_LECON.chapitre).confirme).toBe(false)
  })
})

describe('parcours-lecon — modifier la leçon (#564)', () => {
  it('sans champ qui porte le titre : ROUGE nommé, avec la destination et Refs #564', () => {
    const { rouge } = jugerModification(false, new URL('http://x/teacher/lessons/5/chapters?edit=true'))
    expect(rouge).toBe(`${AUCUN_CHEMIN_MODIFICATION} : « Modifier » ouvre /teacher/lessons/5/chapters?edit=true, sans champ qui porte le titre (Refs #564)`)
    expect(AUCUN_CHEMIN_MODIFICATION).toBe('aucun chemin d’interface ne modifie le titre ni la description')
  })

  it('un champ du titre apparaît (la correction, #572) : la modification se joue, puis la relecture juge', () => {
    expect(jugerModification(true, new URL('http://x/teacher/lessons'))).toBeNull()
  })
})

describe('parcours-lecon — la progression de l’élève relue', () => {
  const chapitres = (is_completed, percentage) => lecture(200, { percentage, chapters: [{ chapter_id: 8, is_completed }] })

  it('VERT : chapitre terminé, 100 %, leçon « completed »', () => {
    expect(jugerProgression(chapitres(true, 100), lecture(200, { status: 'completed' }), 5, 8).confirme).toBe(true)
  })

  it('ROUGE : le chapitre non terminé, la progression partielle, ou la leçon non complétée', () => {
    expect(jugerProgression(chapitres(false, 0), lecture(200, { status: 'completed' }), 5, 8).confirme).toBe(false)
    expect(jugerProgression(chapitres(true, 50), lecture(200, { status: 'completed' }), 5, 8).confirme).toBe(false)
    expect(jugerProgression(chapitres(true, 100), lecture(200, { status: 'in_progress' }), 5, 8))
      .toEqual({ confirme: false, ecart: 'chapitre terminé, mais la leçon relue est « in_progress », « completed » attendu' })
  })
})

describe('parcours-lecon — la suppression relue : l’objet a DISPARU', () => {
  it('VERT : 404, et absente de sa matière', () => {
    expect(jugerSuppression(lecture(404), lecture(200, { lessons: [{ id: 6 }] }), 5, 12))
      .toEqual({ confirme: true, preuve: 'leçon 5 : 404, et absente de la matière 12' })
  })

  it('ROUGE : encore lisible', () => {
    expect(jugerSuppression(lecture(200, { id: 5 }), lecture(200, { lessons: [] }), 5, 12))
      .toEqual({ confirme: false, ecart: 'GET /lessons/5 rend HTTP 200, 404 attendu' })
  })

  it('ROUGE : encore listée dans sa matière', () => {
    expect(jugerSuppression(lecture(404), lecture(200, { lessons: [{ id: 5 }] }), 5, 12))
      .toEqual({ confirme: false, ecart: 'la leçon 5 est encore listée dans sa matière' })
  })
})
