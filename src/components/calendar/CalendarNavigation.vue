<template>
  <div class="navigation-card card">
    <div class="navigation-controls">
      <button class="nav-button" @click="$emit('prev')" title="Mois précédent">
        <i class="material-icons">chevron_left</i>
      </button>

      <div class="current-month">
        <i class="material-icons">calendar_today</i>
        <span>{{ currentMonthLabel }}</span>
      </div>

      <button class="nav-button" @click="$emit('next')" title="Mois suivant">
        <i class="material-icons">chevron_right</i>
      </button>

      <button class="today-button" @click="$emit('today')" title="Revenir à aujourd'hui">
        <i class="material-icons">today</i>
        Aujourd'hui
      </button>

      <button
        class="refresh-button"
        :disabled="refreshing"
        title="Actualiser les donnees depuis KLASSCI"
        @click="$emit('refresh')"
      >
        <i class="material-icons" :class="{ 'spin': refreshing }">sync</i>
        {{ refreshing ? 'Chargement...' : 'Actualiser' }}
      </button>

      <div class="view-selector">
        <button
          :class="{ active: currentView === 'dayGridMonth' }"
          title="Vue mensuelle"
          @click="$emit('change-view', 'dayGridMonth')"
        >
          <i class="material-icons">view_module</i>
          Mois
        </button>
        <button
          :class="{ active: currentView === 'timeGridWeek' }"
          title="Vue hebdomadaire"
          @click="$emit('change-view', 'timeGridWeek')"
        >
          <i class="material-icons">view_week</i>
          Semaine
        </button>
        <button
          :class="{ active: currentView === 'timeGridDay' }"
          title="Vue journalière"
          @click="$emit('change-view', 'timeGridDay')"
        >
          <i class="material-icons">view_day</i>
          Jour
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Barre de navigation du calendrier unifié (#107 — décomposition UniversalCalendar).
 * Sous-composant de présentation : le libellé du mois, la vue active et l'état de
 * rafraîchissement sont des props ; toutes les actions (précédent/suivant/aujourd'hui/
 * actualiser/changement de vue) sont émises. Aucun accès direct à FullCalendar ici.
 */
defineProps({
  currentMonthLabel: { type: String, default: '' },
  currentView: { type: String, default: 'dayGridMonth' },
  refreshing: { type: Boolean, default: false }
})

defineEmits(['prev', 'next', 'today', 'refresh', 'change-view'])
</script>

<style lang="scss" scoped>
// Variables LMS utilisées par ce sous-composant (sous-ensemble local ; les couleurs
// « système » passent par les CSS custom properties globales var(--…)).
$lms-blue: #2563eb;
$lms-blue-dark: #1e3a8a;
$white: #ffffff;
$text-primary: #1E293B;
$text-tertiary: #6B7280;
$gray-lightest: #F9FAFB;
$gray-light: #F8FAFC;
$gray-medium: #E2E8F0;
$gray-border: #E5E7EB;
$gray-dark: #374151;
$transition-fast: all 0.2s ease;
$border-radius-md: 6px;
$border-radius-lg: 8px;

.navigation-card {
  padding: 1rem 1.5rem;

  .navigation-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;

    .nav-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 1px solid var(--border-primary, $gray-border);
      border-radius: $border-radius-md;
      background: transparent;
      color: var(--text-primary, $text-primary);
      cursor: pointer;
      transition: $transition-fast;

      .material-icons {
        font-size: 1.5rem;
        color: var(--text-primary, $text-primary);
      }

      &:hover {
        background: var(--bg-hover, $gray-light);
        border-color: $lms-blue;
        color: $lms-blue;

        .material-icons {
          color: $lms-blue;
        }
      }
    }

    .current-month {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      font-size: 1.5rem;
      font-weight: 600;
      color: $lms-blue;
      text-transform: capitalize;

      .material-icons {
        color: $lms-blue;
      }
    }

    .today-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px solid $lms-blue;
      color: $lms-blue;
      padding: 0.5rem 1rem;
      border-radius: $border-radius-md;
      background: transparent;
      transition: $transition-fast;
      font-weight: 500;
      cursor: pointer;

      &:hover {
        background: $lms-blue;
        color: $white;

        .material-icons {
          color: $white;
        }
      }
    }

    .refresh-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px solid #10b981;
      color: #10b981;
      padding: 0.5rem 1rem;
      border-radius: $border-radius-md;
      background: transparent;
      transition: $transition-fast;
      font-weight: 500;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: #10b981;
        color: $white;

        .material-icons {
          color: $white;
        }
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .material-icons.spin {
        animation: spin 1s linear infinite;
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

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
  }
}

@media (max-width: 768px) {
  .navigation-controls {
    flex-wrap: wrap;

    .current-month {
      order: -1;
      flex-basis: 100%;
      margin-bottom: 1rem;
    }

    .today-button,
    .view-selector {
      flex-basis: 100%;
    }
  }
}
</style>

<!-- Mode sombre : non-scoped pour cibler html[data-theme="dark"] (#107) -->
<style lang="scss">
$lms-blue: #2563eb;
$lms-blue-light: #3b82f6;
$white: #ffffff;

html[data-theme="dark"] {
  .navigation-card {
    .nav-button {
      border-color: rgba($lms-blue-light, 0.5);
      color: $white;
      background: transparent;

      .material-icons {
        color: $white !important;
      }

      &:hover {
        background: rgba($lms-blue-light, 0.3);
        border-color: $lms-blue-light;
        color: $lms-blue-light;

        .material-icons {
          color: $lms-blue-light !important;
        }
      }
    }

    .current-month {
      color: $white;

      .material-icons {
        color: $lms-blue-light;
      }
    }

    .today-button {
      border-color: $lms-blue-light;
      color: $white;
      background: rgba($lms-blue-light, 0.2);

      &:hover {
        background: $lms-blue-light;
        color: $white;

        .material-icons {
          color: $white;
        }
      }
    }

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
}
</style>
