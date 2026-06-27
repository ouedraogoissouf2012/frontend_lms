<template>
  <div class="calendar-card card">
    <ContentLoader v-if="loading" text="Chargement du calendrier..." />

    <div v-else class="calendar-wrapper">
      <FullCalendar
        ref="calendarRef"
        :options="options"
      />
    </div>
  </div>
</template>

<script setup>
/**
 * Carte calendrier du calendrier unifié (H8 — décomposition UniversalCalendar).
 * Encapsule l'instance FullCalendar et son loader. Reçoit la configuration via la
 * prop `options` et l'état `loading` ; expose `getApi()` pour que l'orchestrateur
 * (via useCalendarView) pilote la navigation impérative — parité exacte avec
 * l'ancien `calendarRef.getApi()`. CSS `.fc` clair déplacé verbatim (`:deep`),
 * le bloc `.fc` sombre vit dans le partial `_calendar-fc-dark.scss`.
 */
import { ref } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import ContentLoader from '@/components/common/ContentLoader.vue'

defineProps({
  options: { type: Object, required: true },
  loading: { type: Boolean, default: false }
})

const calendarRef = ref(null)

defineExpose({
  getApi: () => calendarRef.value?.getApi()
})
</script>

<style lang="scss" scoped>
// Variables LMS nécessaires à ce composant (copie locale du sous-ensemble utilisé).
$lms-blue: #2563eb;
$white: #ffffff;
$shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.1);
$transition-fast: all 0.2s ease;
$border-radius-lg: 8px;

// ========== CARD BASE ==========
.card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: $border-radius-lg;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: background 0.2s ease, border-color 0.2s ease;
}

// ========== CALENDAR CARD ==========
.calendar-card {
  padding: 0;
  overflow: hidden;
}

.calendar-wrapper {
  padding: 1rem;
}

.loading-container {
  padding: 4rem;
  text-align: center;
  color: var(--text-tertiary);

  .material-icons {
    font-size: 3rem;
    color: $lms-blue;
    margin-bottom: 1rem;

    &.spin {
      animation: spin 1s linear infinite;
    }
  }

  p {
    font-size: 1rem;
    color: var(--text-secondary);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// ========== FULLCALENDAR CUSTOM STYLES ==========
:deep(.fc) {
  font-family: inherit;

  .fc-toolbar-title {
    display: none;
  }

  .fc-header-toolbar {
    margin-bottom: 1rem;
  }

  .fc-button-primary {
    background: $lms-blue;
    border-color: $lms-blue;
    transition: $transition-fast;

    &:hover:not(:disabled) {
      background: var(--blue-500);
      border-color: var(--blue-500);
    }

    &:focus {
      box-shadow: 0 0 0 3px rgba($lms-blue, 0.2);
    }
  }

  // En-tête des jours (lun, mar, mer, etc.) - Couleur sidebar
  .fc-col-header-cell {
    background: linear-gradient(180deg, #0052cc 0%, #0747a6 100%);
    border-color: #0747a6;

    .fc-col-header-cell-cushion {
      color: $white;
      font-weight: 600;
      padding: 0.75rem 0.5rem;
    }
  }

  // Cases des jours
  .fc-daygrid-day,
  .fc-timegrid-slot {
    background: var(--bg-secondary);
    border-color: var(--border-primary);
  }

  // Numéros des jours
  .fc-daygrid-day-number,
  .fc-timegrid-slot-label {
    color: var(--text-primary);
    padding: 0.5rem;
  }

  // Jour actuel (aujourd'hui)
  .fc-daygrid-day.fc-day-today {
    background: linear-gradient(135deg, rgba($lms-blue, 0.15) 0%, rgba($lms-blue, 0.08) 100%);
    border: 2px solid $lms-blue;

    .fc-daygrid-day-number {
      color: $lms-blue;
      font-weight: 700;
    }
  }

  // Ligne de l'heure actuelle (time grid)
  .fc-timegrid-now-indicator-line {
    border-color: $lms-blue;
    border-width: 2px;
  }

  .fc-timegrid-now-indicator-arrow {
    border-color: $lms-blue;
  }

  .fc-timegrid-slot {
    height: 3rem;
  }

  // Couleurs des événements
  .event-seance {
    background: #2563eb; /* LMS blue (séances) */;
    border-color: #2563eb; /* LMS blue */
  }

  .event-evaluation {
    background: #06b6d4; /* Cyan (évaluations) */;
    border-color: #06b6d4; /* Cyan */
  }

  .event-urgent {
    background: #ef4444 !important;
    border-color: #ef4444 !important;
    animation: pulse 2s infinite;
  }

  // Événements en mode clair
  .fc-event {
    cursor: pointer;
    transition: $transition-fast;

    &:hover {
      opacity: 0.9;
      transform: translateY(-1px);
      box-shadow: $shadow-hover;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>

<!-- Styles mode sombre non-scoped (FullCalendar) — relocalisés dans un partial -->
<style lang="scss">
@use '../../assets/styles/calendar-fc-dark';
</style>
