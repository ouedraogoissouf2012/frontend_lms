<template>
  <div class="filters-card">
    <div class="filters-grid">
      <div class="filter-group">
        <label class="filter-label">Période</label>
        <select v-model="days" @change="$emit('change')" class="filter-select">
          <option value="7">7 derniers jours</option>
          <option value="14">14 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="60">60 derniers jours</option>
          <option value="90">90 derniers jours</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Enseignant</label>
        <select v-model="teacherId" @change="$emit('change')" class="filter-select">
          <option value="">Tous les enseignants</option>
          <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
            {{ teacher.nom }} {{ teacher.prenom }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Classe</label>
        <select v-model="classeId" @change="$emit('change')" class="filter-select">
          <option value="">Toutes les classes</option>
          <option v-for="classe in classes" :key="classe.id" :value="classe.id">
            {{ classe.name || classe.libelle }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Statut</label>
        <select v-model="status" @change="$emit('change')" class="filter-select">
          <option value="">Tous les statuts</option>
          <option value="active">Actives</option>
          <option value="scheduled">Planifiées</option>
          <option value="completed">Terminées</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Barre de filtres d'AdminSeances (#G1 ≤300). Période / enseignant / classe / statut
 * en v-model (defineModel) ; les listes enseignants & classes sont des props ;
 * émet `change` à chaque modification pour déclencher le rechargement. Aucun appel API.
 */
const days = defineModel('days', { default: '30' })
const teacherId = defineModel('teacherId', { default: '' })
const classeId = defineModel('classeId', { default: '' })
const status = defineModel('status', { default: '' })

defineProps({
  teachers: { type: Array, default: () => [] },
  classes: { type: Array, default: () => [] },
})

defineEmits(['change'])
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

.filter-select {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: var(--color-primary);
}

.filter-select:focus {
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
