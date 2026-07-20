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
$transition-fast: all 0.2s ease;
$border-radius-md: 6px;
$border-radius-lg: 8px;

.view-selector {
  display: flex;
  gap: 0.5rem;
  border: 1px solid var(--border-primary);
  border-radius: $border-radius-lg;
  padding: 0.25rem;
  background: var(--bg-tertiary);

  button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: $border-radius-md;
    border: none;
    transition: $transition-fast;
    color: var(--text-tertiary);
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    background: transparent;

    &:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    &.active {
      background: var(--navy-900);
      color: var(--white);
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(var(--navy-900-rgb), 0.2);

      .material-icons {
        color: var(--white);
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

@media (max-width: 520px) {
  .view-selector {
    display: none;
  }
}
</style>

<!-- Styles mode sombre non-scoped pour fonctionner avec data-theme -->
<style lang="scss">

// ========== DARK MODE ==========
html[data-theme="dark"] {
  .view-selector {
    background: var(--bg-tertiary);
    border-color: var(--border-primary);

    button {
      color: rgba(var(--white-rgb), 0.7);

      &:hover {
        background: rgba(var(--blue-500-rgb), 0.3);
        color: var(--white);
      }

      &.active {
        background: linear-gradient(135deg, var(--blue-500-fixed) 0%, var(--color-info-strong) 100%);
        color: var(--white);

        .material-icons {
          color: var(--white);
        }
      }
    }
  }
}
</style>
