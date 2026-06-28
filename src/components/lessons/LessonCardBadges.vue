<template>
  <div class="lesson-badges">
    <span :class="`badge-${lesson.type}`" class="lesson-badge">
      <i :class="`fa ${getTypeIcon(lesson.type)}`"></i> {{ typeBadge.text }}
    </span>
    <span v-if="showStatus" :class="`badge-status-${lesson.status}`" class="lesson-badge">
      <i :class="`fa ${getStatusIcon(lesson.status)}`"></i> {{ statusBadge.text }}
    </span>
  </div>
</template>

<script setup>
/**
 * Badges type + status d'une LessonCard (#H4 ≤300). Données via prop `lesson` ;
 * icônes/libellés délégués à useLessonCard (parité exacte avec l'original).
 */
import { computed } from 'vue'
import { useLessonCard } from '@/composables/useLessonCard'

const props = defineProps({
  lesson: { type: Object, required: true },
  showStatus: { type: Boolean, default: false }
})

const { getTypeIcon, getStatusIcon, getTypeBadge, getStatusBadge } = useLessonCard()

const typeBadge = computed(() => getTypeBadge(props.lesson.type))
const statusBadge = computed(() => getStatusBadge(props.lesson.status))
</script>

<style scoped>
.lesson-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.lesson-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

/* Badges par type */
.badge-cours {
  background: var(--info-bg);
  color: var(--info-text);
}

.badge-tp {
  background: var(--purple-200);
  color: var(--violet-600);
}

.badge-td {
  background: var(--violet-200);
  color: var(--indigo-500);
}

.badge-projet {
  background: #fce7f3;
  color: #be123c;
}

.badge-autre {
  background: var(--border-primary);
  color: var(--text-secondary);
}

/* Badges par status */
.badge-status-draft {
  background: var(--warning-bg);
  color: var(--amber-800);
}

.badge-status-published {
  background: var(--emerald-100);
  color: var(--emerald-800);
}

.badge-status-archived {
  background: var(--error-bg);
  color: var(--error-text);
}
</style>
