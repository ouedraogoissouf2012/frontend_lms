<template>
  <div class="calendar-card card">
    <ContentLoader v-if="loading" text="Chargement du calendrier..." />

    <div v-else class="calendar-wrapper">
      <FullCalendar
        ref="calendarRef"
        class="calendrier-lms"
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
 * l'ancien `calendarRef.getApi()`. Le rendu se règle par nos classes d'événement (`:deep`) ;
 * ses couleurs (clair et sombre) viennent de nos jetons, `_calendar-fc-tokens.scss` (#628).
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
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.loading-container {
  padding: 4rem;
  text-align: center;
  color: var(--text-tertiary);

  .material-icons {
    font-size: 3rem;
    color: var(--color-info-strong);
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

// ========== FULLCALENDAR 7 (#628) ==========
// Les classes de FullCalendar 7 sont hachées : le rendu se règle par NOS jetons (_calendar-fc-tokens.scss) et par nos
// propres classes d'événement (option `eventClass`). Chaque événement prend sa couleur par la variable de v7.
:deep(.event-item) {
  transition: $transition-fast;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: $shadow-hover;
  }
}

// Couleur d'un événement : celle de SES DONNÉES (clé `color`, useCalendarEvents), que v7 écrit en ligne ; le texte
// reste blanc (--fc-classic-event-contrast). Seule l'urgence l'emporte, comme en v6 : `!important` recouvre l'en-ligne.
:deep(.event-urgent) {
  --fc-event-color: var(--red-500) !important;
  animation: pulse 2s infinite;
}

// En-tête des jours, cellule du jour, trait « maintenant » : NOS classes, posées par les options `…Class` de v7
// (fullcalendarClasses.js), aux couleurs de v6. Le sombre est dans _calendar-dark.scss.
:deep(.lms-entete-agenda) {
  background: linear-gradient(180deg, var(--blue-600) 0%, var(--blue-700) 100%);
  color: var(--white);
  font-weight: 600;
}

:deep(.lms-jour-aujourdhui) {
  background: linear-gradient(135deg, rgba(var(--color-info-strong-rgb), 0.15) 0%, rgba(var(--color-info-strong-rgb), 0.08) 100%);
  box-shadow: inset 0 0 0 2px var(--color-info-strong);
}

:deep(.lms-ligne-maintenant) {
  border-color: var(--color-info-strong);
  border-width: 2px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@media (max-width: 640px) {
  .calendar-wrapper {
    padding: 0.75rem;
  }

  // Défilement horizontal du calendrier sur petit écran (crochet : notre classe sur le composant).
  :deep(.calendrier-lms) {
    min-width: 640px;
  }

  :deep(.event-item) {
    font-size: 0.75rem;
    white-space: normal;
  }
}
</style>

<!-- Styles globaux (non-scoped) : les couleurs de FullCalendar 7 par nos jetons (#628), et la carte en sombre. -->
<style lang="scss">
@use '../../assets/styles/calendar-fc-tokens';
@use '../../assets/styles/calendar-dark';
</style>
