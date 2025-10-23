<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-5xl mx-auto px-4">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Erreur -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p class="text-red-700">{{ error }}</p>
        <button @click="$router.go(-1)" class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Retour
        </button>
      </div>

      <!-- Contenu -->
      <div v-else-if="lesson" class="space-y-6">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-3">
                <span :class="typeBadge.class" class="px-3 py-1 rounded text-sm font-medium">
                  {{ typeBadge.icon }} {{ typeBadge.text }}
                </span>
                <span v-if="isTeacher" :class="statusBadge.class" class="px-3 py-1 rounded text-sm font-medium">
                  {{ statusBadge.text }}
                </span>
              </div>
              <h1 class="text-3xl font-bold text-gray-900 mb-2">
                {{ lesson.title }}
              </h1>
              <p v-if="lesson.description" class="text-gray-600">
                {{ lesson.description }}
              </p>
            </div>
            <button @click="$router.go(-1)" class="ml-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
              ← Retour
            </button>
          </div>

          <!-- Métadonnées -->
          <div class="flex items-center gap-6 text-sm text-gray-600 border-t pt-4">
            <div v-if="lesson.duration_minutes" class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
              Durée: {{ formatDuration(lesson.duration_minutes) }}
            </div>
            <div v-if="lesson.published_at" class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
              </svg>
              Publié le {{ formatDate(lesson.published_at) }}
            </div>
          </div>
        </div>

        <!-- Progression (Étudiant uniquement) -->
        <div v-if="!isTeacher && lesson.user_progress" class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Votre progression</h2>
          <LessonProgress :progress="lesson.user_progress" :compact="false" />

          <!-- Actions étudiant -->
          <div class="mt-6 flex items-center gap-3">
            <button
              v-if="lesson.user_progress.progress_percentage < 100"
              @click="markComplete"
              :disabled="updating"
              class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {{ updating ? 'Enregistrement...' : 'Marquer comme terminé' }}
            </button>

            <!-- Notation -->
            <div v-if="lesson.user_progress.progress_percentage >= 100" class="flex items-center gap-2">
              <span class="text-sm text-gray-600">Noter ce cours:</span>
              <div class="flex items-center gap-1">
                <button
                  v-for="star in 5"
                  :key="star"
                  @click="rateLesson(star)"
                  :disabled="updating"
                  class="focus:outline-none disabled:opacity-50"
                >
                  <svg
                    class="w-6 h-6 transition-colors"
                    :class="star <= (hoverRating || lesson.user_progress.rating || 0) ? 'text-yellow-400' : 'text-gray-300'"
                    @mouseenter="hoverRating = star"
                    @mouseleave="hoverRating = 0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistiques (Enseignant uniquement) -->
        <div v-if="isTeacher && lesson.statistics" class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Statistiques</h2>
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-blue-50 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-blue-700">{{ lesson.statistics.students_started }}</div>
              <div class="text-sm text-gray-600 mt-1">Étudiants débutés</div>
            </div>
            <div class="bg-green-50 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-green-700">{{ lesson.statistics.students_completed }}</div>
              <div class="text-sm text-gray-600 mt-1">Étudiants terminés</div>
            </div>
            <div class="bg-purple-50 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-purple-700">{{ lesson.statistics.average_completion_rate }}%</div>
              <div class="text-sm text-gray-600 mt-1">Taux de complétion</div>
            </div>
          </div>

          <!-- Actions enseignant -->
          <div class="mt-6 flex items-center gap-3">
            <button
              @click="$router.push(`/teacher/lessons/${lesson.id}/edit`)"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Modifier cette leçon
            </button>
            <button
              v-if="lesson.status === 'draft'"
              @click="publishLesson"
              :disabled="updating"
              class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {{ updating ? 'Publication...' : 'Publier' }}
            </button>
            <button
              v-else-if="lesson.status === 'published'"
              @click="unpublishLesson"
              :disabled="updating"
              class="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium"
            >
              {{ updating ? 'Dépublication...' : 'Dépublier' }}
            </button>
          </div>
        </div>

        <!-- Contenu de la leçon -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Contenu du cours</h2>
          <div v-if="lesson.content" v-html="lesson.content" class="prose max-w-none"></div>
          <div v-else class="text-gray-500 italic">Aucun contenu disponible pour cette leçon.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/services/api'
import lessonService from '@/services/lesson'
import LessonProgress from '@/components/lessons/LessonProgress.vue'

export default {
  name: 'LessonView',
  components: {
    LessonProgress
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const lesson = ref(null)
    const loading = ref(true)
    const error = ref(null)
    const updating = ref(false)
    const hoverRating = ref(0)

    const user = computed(() => auth.getUser())
    const isTeacher = computed(() => ['enseignant', 'teacher', 'coordinateur'].includes(user.value?.role))

    const typeBadge = computed(() => {
      return lesson.value ? lessonService.getTypeBadge(lesson.value.type) : {}
    })

    const statusBadge = computed(() => {
      return lesson.value ? lessonService.getStatusBadge(lesson.value.status) : {}
    })

    const loadLesson = async () => {
      try {
        loading.value = true
        error.value = null

        const response = await lessonService.getLesson(route.params.id)

        if (response.success) {
          lesson.value = response.data
          console.log('✅ Leçon chargée:', lesson.value)
        } else {
          error.value = response.message || 'Erreur lors du chargement de la leçon'
        }
      } catch (err) {
        console.error('[LessonView] Erreur loadLesson:', err)
        error.value = err.response?.data?.message || 'Erreur lors du chargement de la leçon'
      } finally {
        loading.value = false
      }
    }

    const markComplete = async () => {
      try {
        updating.value = true
        const response = await lessonService.markComplete(lesson.value.id)

        if (response.success) {
          lesson.value.user_progress = response.data
          alert('Leçon marquée comme terminée !')
        }
      } catch (err) {
        console.error('[LessonView] Erreur markComplete:', err)
        alert('Erreur lors de la mise à jour: ' + (err.response?.data?.message || err.message))
      } finally {
        updating.value = false
      }
    }

    const rateLesson = async (rating) => {
      try {
        updating.value = true
        const response = await lessonService.rateLesson(lesson.value.id, rating)

        if (response.success) {
          lesson.value.user_progress = response.data
          hoverRating.value = 0
        }
      } catch (err) {
        console.error('[LessonView] Erreur rateLesson:', err)
        alert('Erreur lors de la notation: ' + (err.response?.data?.message || err.message))
      } finally {
        updating.value = false
      }
    }

    const publishLesson = async () => {
      try {
        updating.value = true
        const response = await lessonService.publishLesson(lesson.value.id)

        if (response.success) {
          lesson.value.status = 'published'
          lesson.value.published_at = response.data.published_at
          alert('Leçon publiée avec succès !')
        }
      } catch (err) {
        console.error('[LessonView] Erreur publishLesson:', err)
        alert('Erreur lors de la publication: ' + (err.response?.data?.message || err.message))
      } finally {
        updating.value = false
      }
    }

    const unpublishLesson = async () => {
      try {
        updating.value = true
        const response = await lessonService.unpublishLesson(lesson.value.id)

        if (response.success) {
          lesson.value.status = 'draft'
          lesson.value.published_at = null
          alert('Leçon dépubliée avec succès !')
        }
      } catch (err) {
        console.error('[LessonView] Erreur unpublishLesson:', err)
        alert('Erreur lors de la dépublication: ' + (err.response?.data?.message || err.message))
      } finally {
        updating.value = false
      }
    }

    const formatDuration = (minutes) => {
      return lessonService.formatDuration(minutes)
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    }

    onMounted(() => {
      loadLesson()
    })

    return {
      lesson,
      loading,
      error,
      updating,
      hoverRating,
      isTeacher,
      typeBadge,
      statusBadge,
      markComplete,
      rateLesson,
      publishLesson,
      unpublishLesson,
      formatDuration,
      formatDate
    }
  }
}
</script>

<style scoped>
.prose {
  color: #374151;
  line-height: 1.75;
}

.prose h1 {
  font-size: 2em;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 0.8em;
}

.prose h2 {
  font-size: 1.5em;
  font-weight: 600;
  margin-top: 2em;
  margin-bottom: 1em;
}

.prose p {
  margin-top: 1.25em;
  margin-bottom: 1.25em;
}

.prose ul, .prose ol {
  padding-left: 1.625em;
  margin-top: 1.25em;
  margin-bottom: 1.25em;
}

.prose li {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}
</style>
