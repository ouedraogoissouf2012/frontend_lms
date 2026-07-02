<template>
  <div class="navigation-card card">
    <div class="navigation-controls">
      <button class="nav-button" @click="$emit('previous')" title="Mois précédent">
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

      <button class="refresh-button" @click="$emit('refresh')" :disabled="refreshing" title="Actualiser les donnees depuis KLASSCI">
        <i class="material-icons" :class="{ 'spin': refreshing }">sync</i>
        {{ refreshing ? 'Chargement...' : 'Actualiser' }}
      </button>

      <CalendarViewSelector :current-view="currentView" @change-view="$emit('change-view', $event)" />
    </div>
  </div>
</template>

<script setup>
/**
 * Barre de navigation du calendrier unifié (H8 — décomposition UniversalCalendar).
 * Sous-composant présentationnel : le mois courant, la vue active et l'état
 * « rafraîchissement » sont des props ; toutes les actions sont émises
 * (previous/next/today/refresh/change-view). Le sélecteur de vue est délégué à
 * <CalendarViewSelector>. CSS déplacé verbatim (clair scoped + dark global).
 */
import CalendarViewSelector from './CalendarViewSelector.vue'

defineProps({
  currentMonthLabel: { type: String, default: '' },
  currentView: { type: String, default: 'dayGridMonth' },
  refreshing: { type: Boolean, default: false }
})

defineEmits(['previous', 'next', 'today', 'refresh', 'change-view'])
</script>

<style lang="scss" scoped>
// Variables LMS nécessaires à ce composant (copie locale du sous-ensemble utilisé).
$lms-blue: #2563eb;
$white: #ffffff;
$transition-fast: all 0.2s ease;
$border-radius-md: 6px;
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

// ========== NAVIGATION ==========
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
      border: 1px solid var(--border-primary);
      border-radius: $border-radius-md;
      background: transparent;
      color: var(--text-primary);
      cursor: pointer;
      transition: $transition-fast;

      .material-icons {
        font-size: 1.5rem;
        color: var(--text-primary);
      }

      &:hover {
        background: var(--bg-hover);
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
      border: 1px solid var(--emerald-500);
      color: var(--emerald-500);
      padding: 0.5rem 1rem;
      border-radius: $border-radius-md;
      background: transparent;
      transition: $transition-fast;
      font-weight: 500;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: var(--emerald-500);
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
  }
}

// ========== RESPONSIVE ==========
// (la règle `.view-selector` mobile est déplacée dans CalendarViewSelector.vue,
//  le sélecteur étant désormais un sous-composant — CSS scoped n'atteint pas l'enfant)
@media (max-width: 768px) {
  .navigation-controls {
    flex-wrap: wrap;

    .current-month {
      order: -1;
      flex-basis: 100%;
      margin-bottom: 1rem;
    }

    .today-button {
      flex-basis: 100%;
    }
  }
}
</style>

<!-- Styles mode sombre non-scoped pour fonctionner avec data-theme -->
<style lang="scss">
$white: #ffffff;

// ========== DARK MODE ==========
html[data-theme="dark"] {
  .navigation-card {
    .nav-button {
      border-color: rgba(var(--blue-500-rgb), 0.5);
      color: $white;
      background: transparent;

      .material-icons {
        color: $white !important;
      }

      &:hover {
        background: rgba(var(--blue-500-rgb), 0.3);
        border-color: var(--blue-500-fixed);
        color: var(--blue-500-fixed);

        .material-icons {
          color: var(--blue-500-fixed) !important;
        }
      }
    }

    .current-month {
      color: $white;

      .material-icons {
        color: var(--blue-500-fixed);
      }
    }

    .today-button {
      border-color: var(--blue-500-fixed);
      color: $white;
      background: rgba(var(--blue-500-rgb), 0.2);

      &:hover {
        background: var(--blue-500-fixed);
        color: $white;

        .material-icons {
          color: $white;
        }
      }
    }
  }
}
</style>
