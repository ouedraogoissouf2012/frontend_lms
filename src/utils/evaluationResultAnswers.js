/**
 * Logique PURE de correction d'une soumission d'évaluation (H2).
 *
 * Extraite verbatim des méthodes de `views/evaluations/EvaluationResults.vue`
 * (god-component) : lecture de la réponse étudiant, exactitude, et calcul des
 * classes CSS d'option/vrai-faux selon la disponibilité de la correction.
 * Fonctions pures (aucun effet de bord, aucune dépendance Vue) → consommées par
 * ResultQuestionCard / ResultChoiceOptions et testables isolément.
 *
 * `answers` = objet { [question.id]: réponse } (ex-`submission.answers`).
 * `correctionAvailable` = booléen (ex-`isCorrectionAvailable`).
 */

export function getStudentAnswer(answers, question) {
  const a = answers || {}
  return a[question.id]
}

export function isCorrect(question, answers) {
  const studentAnswer = getStudentAnswer(answers, question)
  const correctAnswers = question.correct_answers || []

  if (question.type === 'qcm') {
    return studentAnswer === correctAnswers[0]
  } else if (question.type === 'qcm_multiple') {
    if (!Array.isArray(studentAnswer)) return false
    return JSON.stringify([...studentAnswer].sort()) === JSON.stringify([...correctAnswers].sort())
  } else if (question.type === 'vrai_faux') {
    return studentAnswer === correctAnswers[0]
  }

  return false // Pour réponse courte/dissertation, correction manuelle
}

export function isOptionSelected(question, optionIndex, answers) {
  const studentAnswer = getStudentAnswer(answers, question)
  const options = question.options || []
  const optionText = options[optionIndex]

  if (question.type === 'qcm_multiple') {
    // Pour QCM multiple, vérifier si la réponse inclut l'index OU le texte
    return Array.isArray(studentAnswer) && (studentAnswer.includes(optionIndex) || studentAnswer.includes(optionText))
  }
  // Pour QCM simple, comparer avec l'index OU le texte
  return studentAnswer === optionIndex || studentAnswer === optionText
}

export function isOptionCorrect(question, optionIndex) {
  const correctAnswers = question.correct_answers || []
  const options = question.options || []
  const optionText = options[optionIndex]

  if (question.type === 'qcm_multiple') {
    // Pour QCM multiple, correct_answers peut contenir des indices OU des textes
    return correctAnswers.includes(optionIndex) || correctAnswers.includes(optionText)
  }
  // Pour QCM simple, correct_answers[0] peut être un indice OU un texte
  return correctAnswers[0] === optionIndex || correctAnswers[0] === optionText
}

export function getOptionClass(question, optionIndex, answers, correctionAvailable) {
  if (!correctionAvailable) {
    // Si correction non disponible, afficher juste la sélection de l'étudiant
    const isSelected = isOptionSelected(question, optionIndex, answers)
    return isSelected ? 'option-selected-waiting' : 'option-not-selected-waiting'
  }

  const isSelected = isOptionSelected(question, optionIndex, answers)
  const correct = isOptionCorrect(question, optionIndex)

  if (correct) return 'option-correct'
  if (isSelected && !correct) return 'option-incorrect'
  return 'option-neutral'
}

export function getOptionBorderClass(question, optionIndex, answers, correctionAvailable) {
  if (!correctionAvailable) {
    const isSelected = isOptionSelected(question, optionIndex, answers)
    return isSelected ? 'border-blue-400' : 'border-gray-300'
  }

  const isSelected = isOptionSelected(question, optionIndex, answers)
  const correct = isOptionCorrect(question, optionIndex)

  if (correct) return 'border-green-500'
  if (isSelected && !correct) return 'border-red-500'
  return 'border-gray-300'
}

export function getOptionDotClass(question, optionIndex, correctionAvailable) {
  if (!correctionAvailable) {
    return 'bg-blue-500'
  }
  const correct = isOptionCorrect(question, optionIndex)
  return correct ? 'bg-green-500' : 'bg-red-500'
}

export function getOptionCheckClass(question, optionIndex, correctionAvailable) {
  if (!correctionAvailable) {
    return 'text-blue-600'
  }
  const correct = isOptionCorrect(question, optionIndex)
  return correct ? 'text-green-600' : 'text-red-600'
}

// Vrai/Faux
export function isVraiFauxSelected(question, option, answers) {
  const studentAnswer = getStudentAnswer(answers, question)
  return studentAnswer === option
}

export function isVraiFauxCorrect(question, option) {
  const correctAnswers = question.correct_answers || []
  return correctAnswers[0] === option
}

export function getVraiFauxClass(question, option, answers, correctionAvailable) {
  if (!correctionAvailable) {
    const isSelected = isVraiFauxSelected(question, option, answers)
    return isSelected ? 'option-selected-waiting' : 'option-not-selected-waiting'
  }

  const isSelected = isVraiFauxSelected(question, option, answers)
  const correct = isVraiFauxCorrect(question, option)

  if (correct) return 'option-correct'
  if (isSelected && !correct) return 'option-incorrect'
  return 'option-neutral'
}

export function getVraiFauxBorderClass(question, option, answers, correctionAvailable) {
  if (!correctionAvailable) {
    const isSelected = isVraiFauxSelected(question, option, answers)
    return isSelected ? 'border-blue-400' : 'border-gray-300'
  }

  const isSelected = isVraiFauxSelected(question, option, answers)
  const correct = isVraiFauxCorrect(question, option)

  if (correct) return 'border-green-500'
  if (isSelected && !correct) return 'border-red-500'
  return 'border-gray-300'
}

export function getVraiFauxDotClass(question, option, correctionAvailable) {
  if (!correctionAvailable) {
    return 'bg-blue-500'
  }
  const correct = isVraiFauxCorrect(question, option)
  return correct ? 'bg-green-500' : 'bg-red-500'
}
