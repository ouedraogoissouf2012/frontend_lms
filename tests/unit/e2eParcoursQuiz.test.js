/**
 * Parcours fonctionnel du QUIZ (PR 2) : la vérification de connaissances d'un chapitre. Ce que chaque relecture
 * exige pour dire VERT, et l'ordre des étapes. « Supprimer le quiz » est ROUGE, nommé, tant qu'aucun bouton ne
 * le propose (#566 : deleteKnowledgeCheck sans appelant).
 */
import { describe, it, expect } from 'vitest'
import {
  ETAPES_QUIZ, DONNEES_QUIZ, AUCUN_CHEMIN_SUPPRESSION_QUIZ, listeDesQuiz,
  jugerQuiz, jugerTentative, jugerSuppressionQuiz, jugerQuizDisparu,
} from '../../e2e/parcours-quiz.mjs'

const lecture = (statut, data) => ({ statut, corps: data === undefined ? null : { success: statut < 400, data } })
const QUESTIONS = DONNEES_QUIZ.questions
const quizRelu = (title, questions = QUESTIONS) => [{ id: 4, title, questions: questions.map((q) => ({ question: q.question })) }]

describe('parcours-quiz — les étapes et ce qu’elles requièrent', () => {
  it('l’enseignant prépare, crée, modifie, publie ; l’élève démarre et soumet ; l’enseignant supprime le quiz puis la leçon', () => {
    expect(ETAPES_QUIZ.map((e) => [e.cle, e.compte, e.requiert])).toEqual([
      ['lecon', 'enseignant', []],
      ['chapitre', 'enseignant', ['lecon']],
      ['creer', 'enseignant', ['chapitre']],
      ['modifier', 'enseignant', ['creer']],
      ['publier', 'enseignant', ['lecon']],
      ['demarrer', 'etudiant', ['publier', 'creer']],
      ['soumettre', 'etudiant', ['demarrer']],
      ['supprimer', 'enseignant', ['creer']],
      ['nettoyer', 'enseignant', ['lecon']],
    ])
  })

  it('aucune étape ne requiert « modifier » ni « supprimer » : leur ROUGE n’arrête pas l’élève', () => {
    expect(ETAPES_QUIZ.some((e) => e.requiert.includes('modifier') || e.requiert.includes('supprimer'))).toBe(false)
  })

  it('chaque étape a une action et une relecture', () => {
    for (const e of ETAPES_QUIZ) {
      expect(typeof e.action).toBe('function')
      expect(typeof e.relecture).toBe('function')
    }
  })

  it('les données fictives : options distinctes (trouvées par leur libellé), aucun mot d’énumération', () => {
    const options = QUESTIONS.flatMap((q) => q.options)
    expect(new Set(options).size).toBe(options.length)
    const texte = [DONNEES_QUIZ.titre, DONNEES_QUIZ.chapitre, DONNEES_QUIZ.quiz, DONNEES_QUIZ.quizModifie, ...options].join(' ')
    expect(texte).not.toMatch(/\b(published|draft|archived|completed)\b/i)
  })
})

describe('parcours-quiz — le quiz relu par la liste de l’enseignant', () => {
  it('la liste que lit l’écran de l’enseignant', () => {
    expect(listeDesQuiz(8)).toBe('/knowledge-checks?chapter_id=8')
  })

  it('VERT : le titre et toutes les questions relus ; l’id est rendu', () => {
    expect(jugerQuiz(lecture(200, quizRelu(DONNEES_QUIZ.quiz)), 8, DONNEES_QUIZ.quiz, QUESTIONS)).toMatchObject({ confirme: true, id: 4 })
  })

  it('ROUGE : aucun quiz, un autre titre, une question absente', () => {
    expect(jugerQuiz(lecture(200, []), 8, DONNEES_QUIZ.quiz, QUESTIONS)).toEqual({ confirme: false, ecart: 'aucun quiz relu pour le chapitre 8' })
    expect(jugerQuiz(lecture(200, quizRelu(DONNEES_QUIZ.quiz)), 8, DONNEES_QUIZ.quizModifie, QUESTIONS).confirme).toBe(false)
    expect(jugerQuiz(lecture(200, quizRelu(DONNEES_QUIZ.quiz, QUESTIONS.slice(0, 1))), 8, DONNEES_QUIZ.quiz, QUESTIONS).ecart)
      .toBe(`question(s) absente(s) du quiz relu : ${QUESTIONS[1].question}`)
  })
})

describe('parcours-quiz — la tentative de l’élève relue (my-attempts)', () => {
  const attempts = (n, best_score, has_passed) => lecture(200, { attempts: Array.from({ length: n }, () => ({})), best_score, has_passed })

  it('VERT : une tentative remise, 100, réussie', () => {
    expect(jugerTentative(attempts(1, 100, true), 4).confirme).toBe(true)
  })

  it('ROUGE : aucune tentative, un score partiel, un échec', () => {
    expect(jugerTentative(attempts(0, null, false), 4)).toEqual({ confirme: false, ecart: '0 tentative(s) remise(s) relue(s), 1 attendue' })
    expect(jugerTentative(attempts(1, 50, false), 4).confirme).toBe(false)
    expect(jugerTentative(attempts(1, 100, false), 4).confirme).toBe(false)
  })
})

describe('parcours-quiz — supprimer le quiz (#566)', () => {
  it('sans bouton : ROUGE nommé, avec Refs #566', () => {
    expect(jugerSuppressionQuiz(false)).toEqual({ rouge: `${AUCUN_CHEMIN_SUPPRESSION_QUIZ} : ni le chapitre en lecture ni le chapitre en édition n’en offre (Refs #566)` })
    expect(AUCUN_CHEMIN_SUPPRESSION_QUIZ).toBe('aucun chemin d’interface ne supprime un quiz')
  })

  it('un bouton apparaît (la correction, #573) : la suppression se joue, puis la relecture juge la disparition', () => {
    expect(jugerSuppressionQuiz(true)).toBeNull()
  })

  it('la relecture de la suppression : le quiz a DISPARU de la liste', () => {
    expect(jugerQuizDisparu(lecture(200, []), 8).confirme).toBe(true)
    expect(jugerQuizDisparu(lecture(200, quizRelu('x')), 8)).toEqual({ confirme: false, ecart: '1 quiz encore relu(s) pour le chapitre 8' })
  })
})
