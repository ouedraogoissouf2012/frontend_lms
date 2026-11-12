import { ref } from 'vue'
import { invalidResponseError } from '@/services/errorHandler'
import knowledgeCheckService from '@/services/knowledgeCheck'
import { estPannePassagere } from '@/utils/pannePassagere'

// Message d'un quiz en PANNE passagère (avec « Réessayer ») ; un refus dit son propre motif.
export const QUIZ_INDISPONIBLE = 'Quiz indisponible pour le moment.'

/**
 * Quiz (« knowledge checks ») des chapitres d'une leçon, extrait de useChapterManager.
 *
 * Un quiz dont le chargement a ÉCHOUÉ est INCONNU, pas absent : l'écran ne doit
 * alors ni dire « Aucun quiz » ni proposer « Créer un quiz », sans quoi une simple
 * coupure pousse l'enseignant à créer un doublon. `isQuizUnknown` porte cet état.
 */
export function useChapterQuizzes() {
  const knowledgeChecks = ref({})
  // Chapitres dont le dernier chargement de quiz a échoué.
  const quizLoadErrors = ref(new Set())
  // Par chapitre en échec : un nouvel essai a-t-il un sens (panne passagère), et quoi dire. Un refus
  // (403…) dit son motif, sans « Réessayer » ; une panne dit « pour le moment », avec.
  const quizEchecs = ref(new Map())
  // Dernier appel par chapitre : seule sa réponse écrit l'état (une réponse
  // périmée, arrivée après un rechargement, ne le réécrit pas).
  const derniersAppels = new Map()

  function marquerInconnu(chapterId, inconnu, error = null) {
    const suivant = new Set(quizLoadErrors.value)
    const echecs = new Map(quizEchecs.value)
    if (inconnu) {
      suivant.add(chapterId)
      const passagere = estPannePassagere(error)
      const message = passagere ? QUIZ_INDISPONIBLE : (error?.userMessage ?? 'Ce quiz ne peut pas être affiché.')
      echecs.set(chapterId, { canRetry: passagere, message })
    } else {
      suivant.delete(chapterId)
      echecs.delete(chapterId)
    }
    quizLoadErrors.value = suivant
    quizEchecs.value = echecs
  }

  async function loadKnowledgeChecks(chapterId) {
    const appel = Symbol(chapterId)
    derniersAppels.set(chapterId, appel)
    try {
      const response = await knowledgeCheckService.getByChapter(chapterId)
      if (derniersAppels.get(chapterId) !== appel) return
      // Faux vide : un « success: false » n'est pas une liste vide, c'est une erreur dite (règle commune :
      // un reason connu est un refus, sans reason une anomalie qu'un nouvel essai peut lever).
      if (response?.success !== true) throw invalidResponseError('GET quiz du chapitre sans success', response)
      knowledgeChecks.value[chapterId] = response.data
      marquerInconnu(chapterId, false)
    } catch (error) {
      if (derniersAppels.get(chapterId) !== appel) return
      console.error('[ChapterManager] Erreur chargement quiz:', error)
      marquerInconnu(chapterId, true, error)
    }
  }

  async function loadAllKnowledgeChecks(chapters) {
    for (const chapter of chapters) {
      if (chapter.id) {
        await loadKnowledgeChecks(chapter.id)
      }
    }
  }

  function isQuizUnknown(chapterId) {
    return quizLoadErrors.value.has(chapterId)
  }

  // L'échec du dernier chargement du quiz d'un chapitre ({ canRetry, message }), ou null.
  function quizEchec(chapterId) {
    return quizEchecs.value.get(chapterId) ?? null
  }

  // Retourne le premier quiz du chapitre (pour type quiz)
  function getChapterQuiz(chapterId) {
    const quizzes = knowledgeChecks.value[chapterId]
    return quizzes && quizzes.length > 0 ? quizzes[0] : null
  }

  return { knowledgeChecks, loadKnowledgeChecks, loadAllKnowledgeChecks, isQuizUnknown, quizEchec, getChapterQuiz }
}
