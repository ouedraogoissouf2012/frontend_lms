import { MAX_OPTIONS } from '@/constants/evaluationQuestions'

const TYPES_REPONSE_UNIQUE = new Set(['qcm', 'vrai_faux'])

/**
 * Les options et les bonnes réponses des questions de l'éditeur d'évaluation (extrait de
 * useCreateQuestions, D466). La bonne réponse est tenue par POSITION (`correctes`) : renommer une
 * option garde sa coche, la supprimer la retire et décale les suivantes. Choisir une bonne réponse
 * lève la marque « orpheline » d'une question chargée ainsi, et celle d'une question dont un changement
 * de type a retiré les coches (D528).
 * @param {import('vue').Ref<Array<object>>} questions
 */
export function useQuestionOptions(questions) {
  function addOption(questionIndex) {
    if (questions.value[questionIndex].options.length >= MAX_OPTIONS) return // B5 : 26 au plus
    questions.value[questionIndex].options.push('')
  }

  function removeOption(questionIndex, optionIndex) {
    const question = questions.value[questionIndex]
    question.options.splice(optionIndex, 1)
    question.correctes = (question.correctes || []).filter((i) => i !== optionIndex).map((i) => (i > optionIndex ? i - 1 : i))
  }

  function setCorrectAnswer(questionIndex, optionIndex) {
    const question = questions.value[questionIndex]
    question.correctes = [optionIndex]
    question.bonneReponseOrpheline = false
    question.bonneReponseAChoisir = false
  }

  function toggleCorrectAnswer(questionIndex, optionIndex) {
    const question = questions.value[questionIndex]
    const correctes = question.correctes || []
    question.correctes = correctes.includes(optionIndex) ? correctes.filter((i) => i !== optionIndex) : [...correctes, optionIndex]
    question.bonneReponseOrpheline = false
    question.bonneReponseAChoisir = false
  }

  // D528 : vers un type à réponse UNIQUE, plusieurs coches ne se réduisent jamais à une en silence : elles
  // sont retirées, et la question attend sa bonne réponse (l'enregistrement est refusé jusque-là).
  function changeType(questionIndex, type) {
    const question = questions.value[questionIndex]
    if (TYPES_REPONSE_UNIQUE.has(type) && (question.correctes || []).length > 1) {
      question.correctes = []
      question.bonneReponseAChoisir = true
    }
    question.type = type
  }

  return { addOption, removeOption, setCorrectAnswer, toggleCorrectAnswer, changeType }
}

/**
 * Les options et les bonnes réponses d'une question, telles qu'elles partent au serveur. Les textes
 * ne sont formés qu'ici (D466) : les options remplies, et les textes des seules options cochées
 * encore remplies. Une option vidée ne part pas, sa coche non plus.
 * @param {object} q - une question de l'éditeur
 * @returns {{ options: string[]|null, correct_answers: string[]|null }}
 */
export function choixPourEnvoi(q) {
  if (q.type === 'qcm' || q.type === 'qcm_multiple' || q.type === 'vrai_faux') {
    const remplies = q.options.map((o, i) => [o, i]).filter(([o]) => o.trim() !== '')
    const correctes = q.correctes || []
    return { options: remplies.map(([o]) => o), correct_answers: remplies.filter(([, i]) => correctes.includes(i)).map(([o]) => o) }
  }
  if (q.type === 'reponse_courte' && q.correct_answers_text) {
    return { options: null, correct_answers: q.correct_answers_text.split(',').map(a => a.trim()) }
  }
  return { options: null, correct_answers: null }
}
