<template>
  <div class="filters-card">
    <div class="filter-item">
      <label class="filter-label">
        <span class="filter-icon">◷</span>
        Période
      </label>
      <select
        v-model="days"
        @change="$emit('change')"
        class="filter-select"
      >
        <option :value="7">7 prochains jours</option>
        <option :value="14">14 prochains jours</option>
        <option :value="30">30 prochains jours</option>
        <option :value="60">60 prochains jours</option>
      </select>
    </div>

    <div class="filter-item">
      <label class="filter-label">
        <i class="fa fa-user filter-icon"></i>
        Enseignant
      </label>
      <select
        v-model="teacherId"
        @change="$emit('change')"
        class="filter-select"
      >
        <option :value="null">Tous les enseignants</option>
        <option v-for="enseignant in enseignants" :key="enseignant.id" :value="enseignant.id">
          {{ enseignant.nom }} {{ enseignant.prenom }}
        </option>
      </select>
    </div>

    <div class="filter-item">
      <label class="filter-label">
        <i class="fa fa-building filter-icon"></i>
        Classe
      </label>
      <select
        v-model="classeId"
        @change="$emit('change')"
        class="filter-select"
      >
        <option :value="null">Toutes les classes</option>
        <option v-for="classe in classes" :key="classe.id" :value="classe.id">
          {{ classe.name || classe.nom }} - {{ classe.filiere?.name || classe.filiere?.nom }} {{ classe.niveau?.name || classe.niveau?.nom }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
/**
 * Filtres de SeanceManagement (#H6 ≤300) : période, enseignant, classe.
 * Présentation pure extraite VERBATIM ; v-model par champ, émet `change`
 * (au change de chaque select) pour relancer le chargement côté parent.
 */
defineProps({
  enseignants: { type: Array, default: () => [] },
  classes: { type: Array, default: () => [] }
})

const days = defineModel('days', { default: 30 })
const teacherId = defineModel('teacherId', { default: null })
const classeId = defineModel('classeId', { default: null })

defineEmits(['change'])
</script>

<style scoped>
/* Filters */
.filters-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-item {
  display: flex;
  flex-direction: column;
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

.filter-icon {
  font-size: 1rem;
  line-height: 1;
}

.filter-select {
  width: 100%;
  padding: 0.625rem;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .filters-card {
    grid-template-columns: 1fr;
  }
}
</style>
