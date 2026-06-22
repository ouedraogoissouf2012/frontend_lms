<template>
  <div class="view-selector">
    <button
      :class="{ active: currentView === 'dayGridMonth' }"
      @click="$emit('change-view', 'dayGridMonth')"
      title="Vue mensuelle"
    >
      <i class="material-icons">view_module</i>
      Mois
    </button>
    <button
      :class="{ active: currentView === 'timeGridWeek' }"
      @click="$emit('change-view', 'timeGridWeek')"
      title="Vue hebdomadaire"
    >
      <i class="material-icons">view_week</i>
      Semaine
    </button>
    <button
      :class="{ active: currentView === 'timeGridDay' }"
      @click="$emit('change-view', 'timeGridDay')"
      title="Vue journalière"
    >
      <i class="material-icons">view_day</i>
      Jour
    </button>
  </div>
</template>

<script setup>
/**
 * Sélecteur de vue du calendrier unifié (H8 — décomposition UniversalCalendar).
 * Sous-composant présentationnel : la vue active est une prop, le changement est
 * émis (`change-view`). Aucun état ni appel API. CSS déplacé verbatim depuis
 * UniversalCalendar (clair scoped + dark mode global non-scoped).
 */
defineProps({
  currentView: { type: String, default: 'dayGridMonth' }
})

defineEmits(['change-view'])
</script>

<style lang="scss" scoped>
// Variables LMS nécessaires à ce composant (copie locale du sous-ensemble utilisé).
$lms-blue: #2563eb;
$lms-blue-dark: #1e3a8a;
$white: #ffffff;
$text-tertiary: #6B7280;
$gray-lightest: #F9FAFB;
$gray-medium: #E2E8F0;
$gray-border: #E5E7EB;
$gray-dark: #374151;
$transition-fast: all 0.2s ease;
$border-radius-md: 6px;
$border-radius-lg: 8px;

.view-selector {
  display: flex;
  gap: 0.5rem;
  border: 1px solid var(--border-primary, $gray-border);
  border-radius: $border-radius-lg;
  padding: 0.25rem;
  background: var(--bg-tertiary, $gray-lightest);

  button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: $border-radius-md;
    border: none;
    transition: $transition-fast;
    color: var(--text-tertiary, $text-tertiary);
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    background: transparent;

    &:hover {
      background: var(--bg-hover, $gray-medium);
      color: var(--text-primary, $gray-dark);
    }

    &.active {
      background: $lms-blue-dark;
      color: $white;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba($lms-blue-dark, 0.2);

      .material-icons {
        color: $white;
      }
    }
  }
}

// ========== RESPONSIVE ==========
@media (max-width: 768px) {
  .view-selector {
    flex-basis: 100%;
  }
}
</style>

<!-- Styles mode sombre non-scoped pour fonctionner avec data-theme -->
<style lang="scss">
$lms-blue: #2563eb;
$lms-blue-light: #3b82f6;
$white: #ffffff;

// ========== DARK MODE ==========
html[data-theme="dark"] {
  .view-selector {
    background: var(--bg-tertiary);
    border-color: var(--border-primary);

    button {
      color: rgba($white, 0.7);

      &:hover {
        background: rgba($lms-blue-light, 0.3);
        color: $white;
      }

      &.active {
        background: linear-gradient(135deg, $lms-blue-light 0%, $lms-blue 100%);
        color: $white;

        .material-icons {
          color: $white;
        }
      }
    }
  }
}
</style>
