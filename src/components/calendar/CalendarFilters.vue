<template>
  <div class="filters-card card">
    <div class="filters-header">
      <div class="filters-title">
        <i class="material-icons">filter_list</i>
        <h3>Filtres</h3>
      </div>
      <button class="reset-button" @click="$emit('reset')">
        <i class="material-icons">refresh</i>
        Réinitialiser
      </button>
    </div>

    <div class="filters-content">
      <!-- Filtre Type -->
      <div class="filter-field">
        <label><i class="material-icons icon-label">bookmark</i> Type</label>
        <select v-model="eventTypeFilter">
          <option value="all">Tous les types</option>
          <option value="seances">Séances uniquement</option>
          <option value="evaluations">Évaluations uniquement</option>
        </select>
      </div>

      <!-- Filtre Période -->
      <div class="filter-field">
        <label><i class="material-icons icon-label">date_range</i> Période</label>
        <select v-model="dateRangePreset" @change="$emit('apply-preset')">
          <option value="all">Tout</option>
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="7days">7 prochains jours</option>
          <option value="30days">30 prochains jours</option>
          <option value="90days">90 prochains jours</option>
        </select>
      </div>

      <!-- Filtre Matière -->
      <div v-if="showMatiereFilter" class="filter-field">
        <label><i class="material-icons icon-label">school</i> Matière</label>
        <select v-model="selectedMatiere">
          <option value="">Toutes les matières</option>
          <option v-for="matiere in matieres" :key="matiere.id" :value="matiere.id">
            {{ matiere.nom }}
          </option>
        </select>
      </div>

      <!-- Filtre Classe -->
      <div v-if="showClasseFilter" class="filter-field">
        <label><i class="material-icons icon-label">people</i> Classe</label>
        <select v-model="selectedClasse">
          <option value="">Toutes les classes</option>
          <option v-for="classe in classes" :key="classe.id" :value="classe.id">
            {{ classe.nom }}
          </option>
        </select>
      </div>

      <!-- Filtre Enseignant -->
      <div v-if="showEnseignantFilter" class="filter-field">
        <label><i class="material-icons icon-label">person</i> Enseignant</label>
        <select v-model="selectedEnseignant">
          <option value="">Tous les enseignants</option>
          <option v-for="enseignant in enseignants" :key="enseignant.id" :value="enseignant.id">
            {{ enseignant.nom }} {{ enseignant.prenom }}
          </option>
        </select>
      </div>

      <!-- Compteur d'événements -->
      <div class="filter-count">
        <i class="material-icons">event_available</i>
        <span>{{ eventCount }} événement(s) trouvé(s)</span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Barre de filtres du calendrier unifié (#28bis — décomposition UniversalCalendar).
 * Sous-composant de présentation : les 5 filtres sont des v-model (defineModel),
 * les listes + flags de visibilité + compteur sont des props, et les actions
 * (réinitialiser, appliquer la période) sont émises. Aucun appel API ici.
 */
const eventTypeFilter = defineModel('eventTypeFilter', { type: String, default: 'all' })
const dateRangePreset = defineModel('dateRangePreset', { type: String, default: 'all' })
const selectedMatiere = defineModel('selectedMatiere', { default: '' })
const selectedClasse = defineModel('selectedClasse', { default: '' })
const selectedEnseignant = defineModel('selectedEnseignant', { default: '' })

defineProps({
  matieres: { type: Array, default: () => [] },
  classes: { type: Array, default: () => [] },
  enseignants: { type: Array, default: () => [] },
  showMatiereFilter: { type: Boolean, default: false },
  showClasseFilter: { type: Boolean, default: false },
  showEnseignantFilter: { type: Boolean, default: false },
  eventCount: { type: Number, default: 0 }
})

defineEmits(['reset', 'apply-preset'])
</script>

<style lang="scss" scoped>
// Variables LMS nécessaires à ce composant (copie locale du sous-ensemble utilisé ;
// les couleurs « système » passent par les CSS custom properties globales var(--…)).
// NB : la carte de base `.card` est fournie par le parent via :deep() (#107), pas dupliquée ici.
$lms-blue: #2563eb;
$lms-blue-light: #3b82f6;
$lms-blue-dark: #1e3a8a;
$white: #ffffff;
$text-primary: #1E293B;
$text-secondary: #64748B;
$text-tertiary: #6B7280;
$gray-light: #F8FAFC;
$gray-border: #E5E7EB;
$transition-fast: all 0.2s ease;
$border-radius-md: 6px;
$border-radius-full: 9999px;

.filters-card {
  .filters-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;

    .filters-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .material-icons {
        color: $lms-blue;
        font-size: 1.5rem;
      }

      h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: $lms-blue;
      }
    }

    .reset-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      color: var(--text-tertiary, $text-tertiary);
      cursor: pointer;
      transition: $transition-fast;
      border-radius: $border-radius-md;
      font-weight: 500;

      &:hover {
        background: var(--bg-hover, $gray-light);
        color: $lms-blue;
      }
    }
  }

  .filters-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    align-items: end;

    .filter-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary, $text-secondary);
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .icon-label {
          font-size: 1.125rem;
          color: $lms-blue;
        }
      }

      select {
        padding: 0.75rem 1rem;
        border: 1px solid var(--input-border, $gray-border);
        border-radius: $border-radius-md;
        background: var(--input-bg, $white);
        color: var(--input-text, $text-primary);
        font-size: 0.875rem;
        cursor: pointer;
        transition: $transition-fast;

        option {
          background: var(--bg-primary, $white);
          color: var(--text-primary, $text-primary);
        }

        &:hover {
          border-color: $lms-blue-light;
        }

        &:focus {
          outline: none;
          border-color: $lms-blue;
          box-shadow: 0 0 0 3px rgba($lms-blue, 0.1);
        }
      }
    }

    .filter-count {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: $lms-blue-dark;
      border-radius: $border-radius-full;
      color: $white;
      font-weight: 600;
      white-space: nowrap;
      justify-self: end;

      .material-icons {
        color: $white;
        font-size: 1.25rem;
      }
    }
  }
}

@media (max-width: 768px) {
  .filters-content {
    grid-template-columns: 1fr !important;

    .filter-count {
      justify-self: stretch;
      justify-content: center;
    }
  }
}
</style>

<!-- Mode sombre : non-scoped pour cibler html[data-theme="dark"] (rapatrié du parent, #107) -->
<style lang="scss">
$lms-blue: #2563eb;
$lms-blue-light: #3b82f6;
$white: #ffffff;

html[data-theme="dark"] {
  .filters-card {
    .filters-title {
      .material-icons {
        color: $lms-blue-light;
      }

      h3 {
        color: $white;
      }
    }

    .reset-button {
      color: rgba($white, 0.7);

      &:hover {
        background: rgba($lms-blue-light, 0.3);
        color: $lms-blue-light;
      }
    }

    .filter-field {
      label {
        color: rgba($white, 0.8);

        .icon-label {
          color: $lms-blue-light;
        }
      }

      select {
        background: var(--input-bg);
        border-color: var(--input-border);
        color: var(--input-text);

        &:hover {
          border-color: $lms-blue-light;
        }

        &:focus {
          border-color: $lms-blue-light;
          box-shadow: 0 0 0 3px rgba($lms-blue-light, 0.2);
        }

        option {
          background: var(--bg-primary);
          color: var(--text-primary);
        }
      }
    }

    .filter-count {
      background: linear-gradient(135deg, $lms-blue-light 0%, $lms-blue 100%);
      color: $white;

      .material-icons {
        color: $white;
      }
    }
  }
}
</style>
