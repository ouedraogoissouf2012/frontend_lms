<template>
  <div class="filters-section">
    <div class="filters-row">
      <!-- Filtre par matière -->
      <div class="filter-group" v-if="availableFilters.matieres.length > 0">
        <label class="filter-label">Matière</label>
        <select v-model="selectedMatiere" @change="$emit('apply')" class="filter-select">
          <option value="">Toutes les matières</option>
          <option v-for="matiere in availableFilters.matieres" :key="matiere.id" :value="matiere.id">
            {{ matiere.name }}
          </option>
        </select>
      </div>

      <!-- Filtre par enseignant -->
      <div class="filter-group" v-if="availableFilters.enseignants.length > 0">
        <label class="filter-label">Enseignant</label>
        <select v-model="selectedEnseignant" @change="$emit('apply')" class="filter-select">
          <option value="">Tous les enseignants</option>
          <option v-for="enseignant in availableFilters.enseignants" :key="enseignant.id" :value="enseignant.id">
            {{ enseignant.name }}
          </option>
        </select>
      </div>

      <!-- Bouton reset filtres -->
      <button v-if="selectedMatiere || selectedEnseignant" @click="$emit('reset')" class="reset-filters-btn">
        <i class="fa fa-times"></i> Effacer filtres
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Barre de filtres de StudentCourses (#G1 ≤300). Matière + enseignant en v-model
 * (defineModel) ; émet `apply` au changement de select et `reset` au clic. Aucun
 * appel API : la liste des options vient de la prop availableFilters.
 */
const selectedMatiere = defineModel('selectedMatiere', { type: String, default: '' })
const selectedEnseignant = defineModel('selectedEnseignant', { type: String, default: '' })

defineProps({
  availableFilters: { type: Object, default: () => ({ matieres: [], enseignants: [] }) },
})

defineEmits(['apply', 'reset'])
</script>

<style scoped>
.filters-section {
  background: var(--card-bg);
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--card-shadow);
}

.filters-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.filter-select {
  padding: 0.625rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: var(--primary);
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.reset-filters-btn {
  padding: 0.625rem 1rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reset-filters-btn:hover {
  background: var(--error-bg);
  color: var(--red-600);
  border-color: var(--red-600);
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    min-width: auto;
  }
}
</style>
