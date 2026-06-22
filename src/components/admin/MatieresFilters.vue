<template>
  <div class="filters-card">
    <div class="filter-item-large">
      <label class="filter-label">
        <MagnifyingGlassIcon class="w-4 h-4" />
        Recherche
      </label>
      <input
        v-model="search"
        type="text"
        placeholder="Nom de matière, code..."
        class="filter-input"
      />
    </div>
    <div class="filter-item">
      <label class="filter-label">
        <AcademicCapIcon class="w-4 h-4" />
        Filière
      </label>
      <select v-model="filiereId" class="filter-select">
        <option value="">Toutes les filières</option>
        <option v-for="filiere in filieres" :key="filiere.id" :value="filiere.id">
          {{ filiere.nom || filiere.name || filiere.code }}
        </option>
      </select>
    </div>
    <div class="filter-item">
      <label class="filter-label">
        <AcademicCapIcon class="w-4 h-4" />
        Niveau
      </label>
      <select v-model="niveauId" class="filter-select">
        <option value="">Tous les niveaux</option>
        <option v-for="niveau in niveaux" :key="niveau.id" :value="niveau.id">
          {{ niveau.nom || niveau.code }}
        </option>
      </select>
    </div>
    <button
      v-if="filiereId || niveauId || search"
      @click="$emit('reset')"
      class="btn-reset"
      title="Réinitialiser les filtres"
    >
      <ArrowPathIcon class="w-4 h-4" />
      Réinitialiser
    </button>
  </div>
</template>

<script setup>
/**
 * Barre de filtres d'AdminMatieres (#G1 ≤300). Recherche + filière + niveau en
 * v-model (defineModel) ; les listes filières/niveaux sont des props. Le bouton
 * de réinitialisation émet `reset`. Aucun appel API.
 */
import {
  AcademicCapIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon
} from '@heroicons/vue/24/outline'

const search = defineModel('search', { type: String, default: '' })
const filiereId = defineModel('filiereId', { default: '' })
const niveauId = defineModel('niveauId', { default: '' })

defineProps({
  filieres: { type: Array, default: () => [] },
  niveaux: { type: Array, default: () => [] },
})

defineEmits(['reset'])
</script>

<style scoped>
/* Filters */
.filters-card {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-item-large {
  flex: 1;
  min-width: 300px;
}

.filter-item {
  min-width: 200px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.filter-input,
.filter-select {
  width: 100%;
  padding: 0.625rem;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.btn-reset {
  padding: 0.625rem 1rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: var(--hover-bg);
}

@media (max-width: 768px) {
  .filters-card {
    flex-direction: column;
  }

  .filter-item-large,
  .filter-item {
    min-width: 100%;
  }
}
</style>
