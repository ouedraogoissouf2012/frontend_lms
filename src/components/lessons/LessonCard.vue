<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
    <!-- Header avec badge type -->
    <div class="p-4 border-b border-gray-100">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span :class="typeBadge.class" class="px-2 py-1 rounded text-xs font-medium">
              {{ typeBadge.icon }} {{ typeBadge.text }}
            </span>
            <span v-if="showStatus" :class="statusBadge.class" class="px-2 py-1 rounded text-xs font-medium">
              {{ statusBadge.text }}
            </span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-1">
            {{ lesson.title }}
          </h3>
          <p v-if="lesson.description" class="text-sm text-gray-600 line-clamp-2">
            {{ lesson.description }}
          </p>
        </div>
      </div>
    </div>

    <!-- Body avec infos -->
    <div class="p-4 space-y-3">
      <!-- Durée -->
      <div v-if="lesson.duration_minutes" class="flex items-center text-sm text-gray-600">
        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
        </svg>
        Durée: {{ formatDuration(lesson.duration_minutes) }}
      </div>

      <!-- Progression (si étudiant) -->
      <div v-if="showProgress && lesson.user_progress">
        <LessonProgress :progress="lesson.user_progress" :compact="true" />
      </div>

      <!-- Statistiques (si enseignant) -->
      <div v-if="showStats && lesson.statistics" class="grid grid-cols-3 gap-2 text-center">
        <div class="bg-blue-50 rounded p-2">
          <div class="text-lg font-bold text-blue-700">{{ lesson.statistics.students_started }}</div>
          <div class="text-xs text-gray-600">Débutés</div>
        </div>
        <div class="bg-green-50 rounded p-2">
          <div class="text-lg font-bold text-green-700">{{ lesson.statistics.students_completed }}</div>
          <div class="text-xs text-gray-600">Terminés</div>
        </div>
        <div class="bg-purple-50 rounded p-2">
          <div class="text-lg font-bold text-purple-700">{{ lesson.statistics.average_completion_rate }}%</div>
          <div class="text-xs text-gray-600">Moyenne</div>
        </div>
      </div>
    </div>

    <!-- Footer avec actions -->
    <div class="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
      <!-- Date de publication -->
      <span v-if="lesson.published_at" class="text-xs text-gray-500">
        Publié le {{ formatDate(lesson.published_at) }}
      </span>
      <span v-else class="text-xs text-gray-500">
        Créé le {{ formatDate(lesson.created_at) }}
      </span>

      <!-- Actions selon le rôle -->
      <div class="flex items-center gap-2">
        <!-- Enseignant: actions CRUD -->
        <template v-if="isTeacher">
          <button
            v-if="lesson.status === 'draft'"
            @click.stop="$emit('publish', lesson.id)"
            class="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            Publier
          </button>
          <button
            v-else-if="lesson.status === 'published'"
            @click.stop="$emit('unpublish', lesson.id)"
            class="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Dépublier
          </button>
          <button
            @click.stop="$emit('edit', lesson.id)"
            class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Modifier
          </button>
          <button
            @click.stop="$emit('delete', lesson.id)"
            class="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Supprimer
          </button>
        </template>

        <!-- Étudiant/Tous: bouton consulter -->
        <button
          @click.stop="$emit('view', lesson.id)"
          class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          {{ isTeacher ? 'Détails' : 'Consulter' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import lessonService from '@/services/lesson'
import LessonProgress from './LessonProgress.vue'

export default {
  name: 'LessonCard',
  components: {
    LessonProgress
  },
  props: {
    lesson: {
      type: Object,
      required: true
    },
    isTeacher: {
      type: Boolean,
      default: false
    },
    showProgress: {
      type: Boolean,
      default: true
    },
    showStats: {
      type: Boolean,
      default: false
    },
    showStatus: {
      type: Boolean,
      default: false
    }
  },
  emits: ['view', 'edit', 'delete', 'publish', 'unpublish'],
  computed: {
    typeBadge() {
      return lessonService.getTypeBadge(this.lesson.type)
    },
    statusBadge() {
      return lessonService.getStatusBadge(this.lesson.status)
    }
  },
  methods: {
    formatDuration(minutes) {
      return lessonService.formatDuration(minutes)
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
