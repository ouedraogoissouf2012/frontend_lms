import { ref } from 'vue'
import knowledgeCheckService from '@/services/knowledgeCheck'

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
  // Dernier appel par chapitre : seule sa réponse écrit l'état (une réponse
  // périmée, arrivée après un rechargement, ne le réécrit pas).
  const derniersAppels = new Map()

  function marquerInconnu(chapterId, inconnu) {
    const suivant = new Set(quizLoadErrors.value)
    if (inconnu) suivant.add(chapterId)
    else suivant.delete(chapterId)
    quizLoadErrors.value = suivant
  }

  async function loadKnowledgeChecks(chapterId) {
    const appel = Symbol(chapterId)
    derniersAppels.set(chapterId, appel)
    try {
      const response = await knowledgeCheckService.getByChapter(chapterId)
      if (derniersAppels.get(chapterId) !== appel) return
      if (response.success) {
        knowledgeChecks.value[chapterId] = response.data
        marquerInconnu(chapterId, false)
      }
    } catch (error) {
      if (derniersAppels.get(chapterId) !== appel) return
      console.error('[ChapterManager] Erreur chargement quiz:', error)
      marquerInconnu(chapterId, true)
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

  // Retourne le premier quiz du chapitre (pour type quiz)
  function getChapterQuiz(chapterId) {
    const quizzes = knowledgeChecks.value[chapterId]
    return quizzes && quizzes.length > 0 ? quizzes[0] : null
  }

  return { knowledgeChecks, loadKnowledgeChecks, loadAllKnowledgeChecks, isQuizUnknown, getChapterQuiz }
}
