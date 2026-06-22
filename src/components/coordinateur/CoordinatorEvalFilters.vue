<template>
  <div class="filters-card">
    <div class="filters-grid-coordinator">
      <!-- Filtre Enseignant (NOUVEAU pour coordinateur) -->
      <div class="filter-item">
        <label class="filter-label">
          <UserIcon class="w-4 h-4" />
          Enseignant
        </label>
        <select v-model="filters.enseignant_id" @change="$emit('apply')" class="filter-select">
          <option value="">Tous les enseignants</option>
          <option v-for="enseignant in enseignants" :key="enseignant.klassci_id" :value="enseignant.klassci_id">
            {{ enseignant.name }}
          </option>
        </select>
      </div>

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
          <option value="brouillon">Brouillon</option>
          <option value="planifiee">Planifiée</option>
          <option value="en_cours">En cours</option>
          <option value="terminee">Terminée</option>
        </select>
      </div>

      <!-- Reset -->
      <div class="filter-item">
        <label class="filter-label">&nbsp;</label>
        <button @click="$emit('reset')" class="filter-reset-btn">
          <XMarkIcon class="w-4 h-4" />
          Réinitialiser
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Barre de filtres de CoordinatorEvaluations (H2 ≤300) : enseignant / classe /
 * matière / statut + réinitialisation. Section présentationnelle extraite verbatim.
 * `filters` en v-model (objet partagé) ; émet `apply` (au change) et `reset`.
 */
import {
  UserIcon,
  UserGroupIcon,
  BookOpenIcon,
  FlagIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

defineProps({
  enseignants: { type: Array, default: () => [] },
  classes: { type: Array, default: () => [] },
  matieres: { type: Array, default: () => [] }
})

const filters = defineModel('filters', { type: Object, required: true })

defineEmits(['apply', 'reset'])
</script>

<style scoped>
/* Filters */
.filters-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--card-shadow);
}

.filters-grid-coordinator {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-select {
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--input-border);
  border-radius: var(--radius-md);
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: border-color var(--transition-fast);
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary);
}

.filter-reset-btn {
  padding: 0.625rem 1rem;
  background: var(--danger);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background var(--transition-fast);
}

.filter-reset-btn:hover {
  background: var(--danger-hover);
}
</style>
