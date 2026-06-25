import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { forum } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

/**
 * Couche données de ForumTopic (#G1 ≤300). Déplace toute la logique de la vue :
 * chargement du sujet via le service forum, params de route, droits de marquage
 * de solution, publication de réponse et marquage de solution, formatage de date.
 * La vue ne fait plus que câbler ces valeurs aux sous-composants présentationnels.
 *
 * Parité stricte avec l'ancienne Options API : mêmes appels forum.getTopic /
 * forum.replyToTopic / forum.markAsSolution, mêmes routes ('/forum'), mêmes
 * confirm/alert et textes, même format de date fr-FR.
 */
export function useForumTopic() {
  const route = useRoute()
  const router = useRouter()

  const loading = ref(true)
  const topic = ref(null)
  const replyContent = ref('')
  const currentUser = ref(null)

  function getCurrentUser() {
    // Récupérer l'utilisateur connecté depuis le store (#19) — plus de localStorage('user')
    currentUser.value = useAuthStore().currentUser
  }

  function canMarkAsSolution(post) {
    // Seul l'auteur du topic, un enseignant ou un admin peut marquer une solution
    if (!currentUser.value) return false

    const isTopicAuthor = topic.value.user_id === currentUser.value.id
    const isTeacher = currentUser.value.role === 'enseignant' || currentUser.value.role === 'teacher'
    const isAdmin = currentUser.value.role === 'coordinateur' || currentUser.value.role === 'admin' || currentUser.value.role === 'superAdmin'

    return isTopicAuthor || isTeacher || isAdmin
  }

  async function markAsSolution(postId) {
    if (!confirm('Marquer cette réponse comme solution?')) return

    try {
      await forum.markAsSolution(postId)
      await loadTopic()
    } catch (error) {
      console.error('Erreur marquage solution:', error)
      alert('Erreur lors du marquage de la solution')
    }
  }

  async function loadTopic() {
    loading.value = true

    try {
      const topicId = route.params.id
      const response = await forum.getTopic(topicId)

      // Extraire les données de la réponse
      if (response.data) {
        topic.value = response.data
      } else {
        topic.value = response
      }
    } catch (error) {
      console.error('Erreur chargement topic:', error)
      alert('Impossible de charger la discussion')
      router.push('/forum')
    } finally {
      loading.value = false
    }
  }

  async function submitReply() {
    if (!replyContent.value.trim()) {
      alert('Veuillez écrire une réponse')
      return
    }

    try {
      const topicId = route.params.id
      await forum.replyToTopic(topicId, replyContent.value)

      replyContent.value = ''
      await loadTopic()
    } catch (error) {
      console.error('Erreur publication réponse:', error)
      alert('Erreur lors de la publication de la réponse')
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  async function init() {
    await loadTopic()
    getCurrentUser()
  }

  return {
    loading,
    topic,
    replyContent,
    currentUser,
    getCurrentUser,
    canMarkAsSolution,
    markAsSolution,
    loadTopic,
    submitReply,
    formatDate,
    init,
    goToForum: () => router.push('/forum'),
  }
}
