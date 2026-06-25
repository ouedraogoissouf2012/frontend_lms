<template>
  <div class="filters-card">
    <div class="filters-grid">
      <div class="filter-group">
        <label class="filter-label">Période</label>
        <select v-model="days" @change="$emit('reload')" class="filter-select">
          <option value="1">Aujourd'hui</option>
          <option value="7">7 derniers jours</option>
          <option value="14">14 derniers jours</option>
          <option value="30">30 derniers jours</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Statut</label>
        <select v-model="status" @change="$emit('filter')" class="filter-select">
          <option value="">Tous</option>
          <option value="active">En cours</option>
          <option value="scheduled">Planifiées</option>
          <option value="completed">Terminées</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Recherche</label>
        <input
          v-model="search"
          @input="$emit('filter')"
          type="text"
          placeholder="Matière, classe, enseignant..."
          class="filter-input"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Barre de filtres d'AdminVisio (#G1 ≤300). Période + statut + recherche en v-model
 * (defineModel) ; émet `reload` au changement de période et `filter` sur statut/recherche
 * (parité avec @change="loadVisioconferences" / @change|@input="filterVisioconferences").
 */
const days = defineModel('days', { type: String, default: '7' })
const status = defineModel('status', { type: String, default: '' })
const search = defineModel('search', { type: String, default: '' })

defineEmits(['reload', 'filter'])
</script>

<style scoped>
/* Filters */
.filters-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.filter-select,
.filter-input {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--text-primary);
  transition: all 0.2s;
}

.filter-select {
  cursor: pointer;
}

.filter-select:hover,
.filter-input:hover {
  border-color: var(--color-primary);
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
