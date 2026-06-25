<template>
  <div class="filters-card">
    <div class="filters-grid">
      <!-- Filtre Matière -->
      <div class="filter-item">
        <label class="filter-label">
          <i class="fa fa-circle filter-icon"></i>
          Matière
        </label>
        <select v-model="matiereId" @change="$emit('apply')" class="filter-select">
          <option value="">Toutes les matières</option>
          <option v-for="matiere in matieres" :key="matiere.id" :value="matiere.id">
            {{ matiere.nom || matiere.name }}
          </option>
        </select>
      </div>

      <!-- Filtre Statut Visio -->
      <div class="filter-item">
        <label class="filter-label">
          <i class="fa fa-dot-circle-o filter-icon"></i>
          Statut visio
        </label>
        <select v-model="visioStatus" @change="$emit('apply')" class="filter-select">
          <option value="">Tous les statuts</option>
          <option value="none">Sans visio</option>
          <option value="programmee">Programmée</option>
          <option value="active">En direct</option>
          <option value="terminee">Terminée</option>
        </select>
      </div>

      <!-- Filtre Période -->
      <div class="filter-item">
        <label class="filter-label">
          <span class="filter-icon">◷</span>
          Période
        </label>
        <select v-model="period" @change="$emit('apply')" class="filter-select">
          <option value="all">Toutes les périodes</option>
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
        </select>
      </div>

      <!-- Reset -->
      <div class="filter-item filter-actions">
        <button @click="$emit('reset')" class="btn-reset">
          <span class="icon">✕</span>
          Réinitialiser
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Carte de filtres de TeacherSeances (#H6 ≤300) : matière, statut visio,
 * période + réinitialisation. Présentation pure extraite VERBATIM ;
 * v-model par champ, émet `apply` (au change) et `reset`.
 */
defineProps({
  matieres: { type: Array, default: () => [] }
})

const matiereId = defineModel('matiereId', { default: '' })
const visioStatus = defineModel('visioStatus', { default: '' })
const period = defineModel('period', { default: 'all' })

defineEmits(['apply', 'reset'])
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

.filter-icon {
  font-size: 1rem;
  line-height: 1;
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
