<template>
  <div :class="compact ? 'space-y-1' : 'space-y-2'">
    <!-- Label et pourcentage -->
    <div class="flex items-center justify-between">
      <span :class="compact ? 'text-xs' : 'text-sm'" class="font-medium text-gray-700">
        Progression
      </span>
      <div class="flex items-center gap-2">
        <span :class="[progressBadge.class, compact ? 'text-xs' : 'text-sm']" class="px-2 py-0.5 rounded font-medium">
          {{ progressBadge.text }}
        </span>
        <span :class="compact ? 'text-xs' : 'text-sm'" class="font-semibold text-gray-900">
          {{ percentage }}%
        </span>
      </div>
    </div>

    <!-- Barre de progression -->
    <div class="w-full bg-gray-200 rounded-full overflow-hidden" :class="compact ? 'h-2' : 'h-3'">
      <div
        class="h-full transition-all duration-500 ease-out rounded-full"
        :class="progressColorClass"
        :style="{ width: percentage + '%' }"
      ></div>
    </div>

    <!-- Informations supplémentaires (mode non-compact) -->
    <div v-if="!compact && progress" class="flex items-center justify-between text-xs text-gray-600">
      <!-- Temps passé -->
      <span v-if="progress.time_spent_minutes > 0">
        <svg class="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
        </svg>
        {{ formatTimeSpent(progress.time_spent_minutes) }}
      </span>

      <!-- Date de complétion -->
      <span v-if="progress.completed_at">
        <svg class="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        Terminé le {{ formatDate(progress.completed_at) }}
      </span>

      <!-- Dernier accès -->
      <span v-else-if="progress.last_accessed_at">
        Dernier accès: {{ formatDate(progress.last_accessed_at) }}
      </span>
    </div>

    <!-- Note (si disponible) -->
    <div v-if="!compact && progress && progress.rating" class="flex items-center gap-1">
      <span class="text-xs text-gray-600">Votre note:</span>
      <div class="flex items-center">
        <svg
          v-for="star in 5"
          :key="star"
          class="w-4 h-4"
          :class="star <= progress.rating ? 'text-yellow-400' : 'text-gray-300'"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script>
import lessonService from '@/services/lesson'

export default {
  name: 'LessonProgress',
  props: {
    progress: {
      type: Object,
      default: () => ({
        progress_percentage: 0,
        time_spent_minutes: 0,
        status: 'not_started'
      })
    },
    compact: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    percentage() {
      return this.progress?.progress_percentage || 0
    },
    progressBadge() {
      return lessonService.getProgressBadge(this.percentage)
    },
    progressColorClass() {
      const color = this.progressBadge.color
      const colors = {
        gray: 'bg-gray-400',
        red: 'bg-red-500',
        yellow: 'bg-yellow-500',
        blue: 'bg-blue-500',
        green: 'bg-green-500'
      }
      return colors[color] || 'bg-gray-400'
    }
  },
  methods: {
    formatTimeSpent(minutes) {
      if (!minutes) return '0min'

      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60

      if (hours > 0) {
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
      }
      return `${mins}min`
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
