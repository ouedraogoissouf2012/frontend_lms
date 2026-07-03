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
        border-color: var(--color-info-strong);
        color: var(--color-info-strong);

        .material-icons {
          color: var(--color-info-strong);
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
      color: var(--color-info-strong);
      text-transform: capitalize;

      .material-icons {
        color: var(--color-info-strong);
      }
    }

    .today-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px solid var(--color-info-strong);
      color: var(--color-info-strong);
      padding: 0.5rem 1rem;
      border-radius: $border-radius-md;
      background: transparent;
      transition: $transition-fast;
      font-weight: 500;
      cursor: pointer;

      &:hover {
        background: var(--color-info-strong);
        color: var(--white);

        .material-icons {
          color: var(--white);
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
        color: var(--white);

        .material-icons {
          color: var(--white);
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

// ========== DARK MODE ==========
html[data-theme="dark"] {
  .navigation-card {
    .nav-button {
      border-color: rgba(var(--blue-500-rgb), 0.5);
      color: var(--white);
      background: transparent;

      .material-icons {
        color: var(--white) !important;
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
      color: var(--white);

      .material-icons {
        color: var(--blue-500-fixed);
      }
    }

    .today-button {
      border-color: var(--blue-500-fixed);
      color: var(--white);
      background: rgba(var(--blue-500-rgb), 0.2);

      &:hover {
        background: var(--blue-500-fixed);
        color: var(--white);

        .material-icons {
          color: var(--white);
        }
      }
    }
  }
}
</style>
