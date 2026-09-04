<template>
  <section class="compact-agenda card" aria-label="Agenda compact">
    <div class="compact-agenda-header">
      <div class="header-icon">
        <i class="material-icons">view_agenda</i>
      </div>
      <div>
        <h3>Agenda</h3>
        <p>{{ sortedEvents.length }} événement(s)</p>
      </div>
    </div>

    <div v-if="sortedEvents.length" class="agenda-list">
      <button
        v-for="event in sortedEvents"
        :key="event.id"
        type="button"
        class="agenda-item"
        @click="$emit('select', event)"
      >
        <span class="agenda-dot" :style="{ backgroundColor: getEventColor(event) }"></span>
        <span class="agenda-content">
          <span class="agenda-date">{{ formatDate(event.start) }}</span>
          <span class="agenda-title">{{ event.title || 'Événement' }}</span>
          <span class="agenda-time">{{ formatTimeRange(event.start, event.end) }}</span>
        </span>
        <i class="material-icons agenda-chevron">chevron_right</i>
      </button>
    </div>

    <div v-else class="agenda-empty">
      Aucun événement à afficher
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { formatTime as fmtTime } from '@/utils/formatters'

const props = defineProps({
  events: {
    type: Array,
    default: () => []
  }
})

defineEmits(['select'])

const sortedEvents = computed(() => {
  return [...props.events].sort((a, b) => toTimestamp(a.start) - toTimestamp(b.start))
})

function toTimestamp(value) {
  const timestamp = new Date(value || 0).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date non définie'

  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  }).format(date)
}

function formatTimeRange(start, end) {
  const startDate = new Date(start)
  if (Number.isNaN(startDate.getTime())) return 'Horaire non défini'

  const startTime = formatTime(startDate)
  if (!end) return startTime

  const endDate = new Date(end)
  if (Number.isNaN(endDate.getTime())) return startTime

  return `${startTime} - ${formatTime(endDate)}`
}

// #283 : délègue au formatter canonique (l'appelant garantit une Date valide).
function formatTime(date) {
  return fmtTime(date)
}

function getEventColor(event) {
  return event.backgroundColor || event.borderColor || event.color || 'var(--color-info-strong)'
}
</script>

<style scoped>
.compact-agenda {
  display: none;
  padding: 1rem;
}

.compact-agenda-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.header-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  display: grid;
  place-items: center;
  background: var(--blue-100);
  color: var(--color-info-strong);
  flex: 0 0 auto;
}

.compact-agenda-header h3,
.compact-agenda-header p {
  margin: 0;
}

.compact-agenda-header h3 {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 700;
}

.compact-agenda-header p {
  color: var(--text-secondary);
  font-size: 0.8125rem;
}

.agenda-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.agenda-item {
  width: 100%;
  min-height: 4.25rem;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
}

.agenda-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 9999px;
}

.agenda-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.agenda-date,
.agenda-time {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.agenda-title {
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.agenda-chevron {
  color: var(--text-secondary);
}

.agenda-empty {
  padding: 1rem;
  border: 1px dashed var(--border-primary);
  border-radius: 0.5rem;
  color: var(--text-secondary);
  text-align: center;
}

@media (max-width: 520px) {
  .compact-agenda {
    display: block;
  }
}
</style>
