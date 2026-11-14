import { MAX_OPTIONS } from '@/constants/evaluationQuestions'

/**
 * Les options et les bonnes réponses des questions de l'éditeur d'évaluation. Extrait de
 * useCreateQuestions (D466, étape 0) SANS changement de comportement : mêmes fonctions, mêmes
 * effets, sur la même liste `questions`.
 * @param {import('vue').Ref<Array<object>>} questions
 */
export function useQuestionOptions(questions) {
  function addOption(questionIndex) {
    if (questions.value[questionIndex].options.length >= MAX_OPTIONS) return // B5 : 26 au plus
    questions.value[questionIndex].options.push('')
  }

  function removeOption(questionIndex, optionIndex) {
    questions.value[questionIndex].options.splice(optionIndex, 1)
  }

  function setCorrectAnswer(questionIndex, answer) {
    questions.value[questionIndex].correct_answers = [answer]
  }

  function toggleCorrectAnswer(questionIndex, answer) {
    const question = questions.value[questionIndex]
    if (!question.correct_answers) {
      question.correct_answers = []
    }
    const index = question.correct_answers.indexOf(answer)
    if (index > -1) {
      question.correct_answers.splice(index, 1)
    } else {
      question.correct_answers.push(answer)
    }
  }

  return { addOption, removeOption, setCorrectAnswer, toggleCorrectAnswer }
}

/**
 * Les options et les bonnes réponses d'une question, telles qu'elles partent au serveur.
 * @param {object} q - une question de l'éditeur
 * @returns {{ options: string[]|null, correct_answers: unknown[]|null }}
 */
export function choixPourEnvoi(q) {
  if (q.type === 'qcm' || q.type === 'qcm_multiple' || q.type === 'vrai_faux') {
    return { options: q.options.filter(o => o.trim() !== ''), correct_answers: q.correct_answers || [] }
  }
  if (q.type === 'reponse_courte' && q.correct_answers_text) {
    return { options: null, correct_answers: q.correct_answers_text.split(',').map(a => a.trim()) }
  }
  return { options: null, correct_answers: null }
}
