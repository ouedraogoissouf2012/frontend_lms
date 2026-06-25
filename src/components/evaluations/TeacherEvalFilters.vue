<template>
  <div class="filters-card">
    <div class="filters-grid">
      <!-- Filtre Classe -->
      <div class="filter-item">
        <label class="filter-label">
          <UserGroupIcon class="w-4 h-4" />
          Classe
        </label>
        <select v-model="filters.classe_id" @change="$emit('apply')" class="filter-select">
          <option value="">Toutes les classes</option>
          <option v-for="classe in classes" :key="classe.id" :value="classe.id">
            {{ classe.name || classe.libelle }}
          </option>
        </select>
      </div>

      <!-- Filtre Matière -->
      <div class="filter-item">
        <label class="filter-label">
          <BookOpenIcon class="w-4 h-4" />
          Matière
        </label>
        <select v-model="filters.matiere_id" @change="$emit('apply')" class="filter-select">
          <option value="">Toutes les matières</option>
          <option v-for="matiere in matieres" :key="matiere.id" :value="matiere.id">
            {{ matiere.name || matiere.nom }}
          </option>
        </select>
      </div>

      <!-- Filtre Statut -->
      <div class="filter-item">
        <label class="filter-label">
          <FlagIcon class="w-4 h-4" />
          Statut
        </label>
        <select v-model="filters.statut" @change="$emit('apply')" class="filter-select">
          <option value="">Tous les statuts</option>
          <option value="planifiee">Planifiée</option>
          <option value="en_cours">En cours</option>
          <option value="terminee">Terminée</option>
        </select>
      </div>

      <!-- Reset -->
      <div class="filter-item filter-actions">
        <button @click="$emit('reset')" class="btn-reset">
          <XMarkIcon class="w-4 h-4" />
          Réinitialiser
        </button>
      </div>
    </div>

    <!-- Bouton masquer/supprimer les évaluations expirées sans version en ligne -->
    <div v-if="expiredWithoutOnlineCount > 0" class="expired-cleanup-bar">
      <div class="expired-info">
        <ClockIcon class="w-5 h-5 text-amber-500" />
        <span>
          <strong>{{ expiredWithoutOnlineCount }}</strong> évaluation(s) expirée(s) sans version en ligne
        </span>
      </div>
      <div class="expired-actions">
        <button
          v-if="!hideExpired"
          @click="$emit('update:hideExpired', true)"
          class="btn-hide-expired"
        >
          <XMarkIcon class="w-4 h-4" />
          Masquer
        </button>
        <button
          v-else
          @click="$emit('update:hideExpired', false)"
          class="btn-show-expired"
        >
          <EyeIcon class="w-4 h-4" />
          Afficher
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Carte de filtres de TeacherEvaluations (H1) : sélecteurs classe/matière/statut,
 * réinitialisation et barre de gestion des évaluations expirées sans version en
 * ligne. `filters` est le modèle réactif partagé du composable de données : les
 * `<select>` le lient en `v-model` (type des valeurs préservé, identique à
 * l'original) et émettent `apply` au `@change` (= `applyFilters`). CSS déplacé
 * verbatim depuis TeacherEvaluations.
 */
import {
  UserGroupIcon,
  BookOpenIcon,
  FlagIcon,
  XMarkIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'

defineProps({
  filters: { type: Object, required: true },
  classes: { type: Array, default: () => [] },
  matieres: { type: Array, default: () => [] },
  expiredWithoutOnlineCount: { type: Number, default: 0 },
  hideExpired: { type: Boolean, default: true }
})

defineEmits(['apply', 'reset', 'update:hideExpired'])
</script>

<style scoped>
/* Filters Card */
.filters-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  align-items: end;
}

.expired-cleanup-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 0.5rem;
  gap: 1rem;
}

.expired-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.expired-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-hide-expired,
.btn-show-expired {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.btn-hide-expired:hover,
.btn-show-expired:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.filter-select {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: var(--primary-color);
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-actions {
  display: flex;
  align-items: flex-end;
}

.btn-reset {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}

.btn-reset:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
