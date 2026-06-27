<template>
  <div class="filters-card">
    <div class="filters-grid">
      <div class="filter-item">
        <label class="filter-label">
          <span class="filter-icon">◷</span>
          Date début
        </label>
        <input
          v-model="dateFrom"
          type="date"
          class="filter-input"
          @change="$emit('change')"
        />
      </div>

      <div class="filter-item">
        <label class="filter-label">
          <span class="filter-icon">◷</span>
          Date fin
        </label>
        <input
          v-model="dateTo"
          type="date"
          class="filter-input"
          @change="$emit('change')"
        />
      </div>

      <div class="filter-item">
        <label class="filter-label">
          <span class="filter-icon">⌕</span>
          Séance KLASSCI ID
        </label>
        <input
          v-model="seanceId"
          type="text"
          class="filter-input"
          placeholder="ID de la séance"
          @input="$emit('input')"
        />
      </div>

      <div class="filter-actions">
        <button
          v-if="dateFrom || dateTo || seanceId"
          @click="$emit('reset')"
          class="btn-reset"
          title="Réinitialiser tous les filtres"
        >
          Réinitialiser
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Filtres de l'historique des présences (H7) — sous-composant présentationnel
 * extrait d'AttendanceHistory.vue. v-model sur dates + ID séance ; émet
 * change (dates), input (recherche débouncée) et reset au parent.
 */
const dateFrom = defineModel('dateFrom', { type: String, default: '' })
const dateTo = defineModel('dateTo', { type: String, default: '' })
const seanceId = defineModel('seanceId', { type: String, default: '' })

defineEmits(['change', 'input', 'reset'])
</script>

<style scoped>
/* Filters */
.filters-card {
  background: var(--bg-primary);
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.filters-grid {
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.filter-icon {
  font-size: 1rem;
}

.filter-input,
.filter-select {
  padding: 0.625rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--blue-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-reset {
  padding: 0.625rem 1rem;
  background: var(--red-500);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: var(--red-600);
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
